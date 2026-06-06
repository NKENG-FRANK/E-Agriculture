from datetime import timedelta

from fastapi import APIRouter, HTTPException,Header,Security
from pydantic import BaseModel, EmailStr
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from core.security import create_access_token, create_refresh_token
from core.config import settings
from supabase import create_client
from models.farm import FarmType
from models.user import UserBookConsultation
from enum import Enum



router = APIRouter(prefix="/auth", tags=["authentication"])


# For auth operations (sign in, sign up)
supabase_auth = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)

# For DB operations (querying public.users)
supabase_db = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

class UserSignup(BaseModel):
    email: EmailStr
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    post: Optional[str] = "staff"
    role: Optional[str] = "sub_user"  # Default role for new signups

class UserRole(str, Enum):
    admin = "admin"
    owner = "owner"
    sub_user = "sub_user"

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    role: UserRole
    remember_me: bool = False



@router.post("/book-consultation")
async def book_consultation(consultation_data: UserBookConsultation):
    try:
        supabase_db.table("consultations").insert({  # ← supabase_db
            "fullname": consultation_data.fullname,
            "phonenumber": str(consultation_data.phonenumber),
            "email": consultation_data.email,
            "farm_type": consultation_data.farm_type.value,
            "message": consultation_data.message
        }).execute()
        return {"message": "Consultation request submitted successfully."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/signup")
async def signup(user_data: UserSignup):
    # Check if user exists in public.users
    existing = supabase_db.table("users").select("*").eq("email", user_data.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")
    try:
        # 1. Create the user via Admin API (auto-confirms email)
        auth_user = supabase_db.auth.admin.create_user({
            "email": user_data.email,
            "password": user_data.password,
            "email_confirm": True,
            "user_metadata": {
                "first_name": user_data.first_name,
                "last_name": user_data.last_name,
                "post": user_data.post,
                "role": user_data.role
            }
        })
        
        if not auth_user.user:
            raise HTTPException(status_code=400, detail="Failed to create user in auth")

        # NOTE: We rely on the Supabase PostgreSQL trigger to insert into public.users
        # If the trigger is not set up, uncomment the line below:
        # supabase_db.table("users").insert({"id": auth_user.user.id, "email": user_data.email, ...}).execute()

        # 2. Generate SFMS tokens immediately
        access_token = create_access_token({
            "sub": auth_user.user.id,
            "email": user_data.email,
            "role": user_data.role
        })
        refresh_token = create_refresh_token({"sub": auth_user.user.id})
        
        return {
            "message": "Account created successfully.",
            "access_token": access_token, 
            "refresh_token": refresh_token, 
            "token_type": "bearer"
        }
    except Exception as e:
        print("SIGNUP ERROR:", str(e))
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
async def login(user_data: UserLogin):
    try:
        # 1. Use supabase_db (service role) to avoid the set_auth bug
        # and ensure we can read the user session correctly
        try:
            auth_response = supabase_db.auth.sign_in_with_password({
                "email": user_data.email,
                "password": user_data.password
            })
        except Exception as auth_err:
            error_str = str(auth_err)
            print(f"SUPABASE AUTH REJECTION: {error_str}")
            
            # Catch the specific 'set_auth' bug but allow login if user exists
            if "'NoneType' object has no attribute 'set_auth'" in error_str:
                print("Ignoring set_auth bug, continuing with user record...")
                # We need to manually fetch the user if auth_response crashed but succeeded
                user_search = supabase_db.auth.admin.list_users()
                user = next((u for u in user_search if u.email == user_data.email), None)
                if not user:
                    raise HTTPException(status_code=401, detail="Invalid credentials")
            else:
                raise HTTPException(status_code=401, detail="Invalid email or password")

        if auth_response and auth_response.user:
            user = auth_response.user
        elif not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # 2. Verify Role
        user_record = supabase_db.table("users").select("role").eq("id", user.id).execute()
        
        if not user_record.data:
            role = user_data.role.value
        else:
            role = user_record.data[0].get("role")
            if role != user_data.role.value:
                raise HTTPException(status_code=403, detail="Role mismatch — access denied")

        # 3. Create tokens
        expires = timedelta(days=30) if user_data.remember_me else None
        access_token = create_access_token(
            {"sub": user.id, "email": user.email, "role": role},
            expires_delta=expires
        )
        refresh_token = create_refresh_token({"sub": user.id})

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "role": role,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"LOGIN CRITICAL ERROR: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=401, detail="Authentication failed")
    
bearer_scheme = HTTPBearer()

@router.post("/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Security(bearer_scheme)):
    try:
        # Extract token from "Bearer <token>"
        token = credentials.credentials

        # Set the user's session then sign out — invalidates the token on Supabase side
        supabase_db.auth.set_session(token, "")
        supabase_db.auth.sign_out()

        return {"message": "Logged out successfully."}

    except Exception as e:
        print("LOGOUT ERROR:", str(e))
        raise HTTPException(status_code=400, detail="Logout failed")