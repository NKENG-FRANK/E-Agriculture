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
    existing = supabase_db.table("users").select("*").eq("email", user_data.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")
    try:
        # Use admin client to create and auto-confirm user
        auth_user = supabase_db.auth.admin.create_user({
            "email": user_data.email,
            "password": user_data.password,
            "email_confirm": True, # Bypasses email verification
            "user_metadata": {
                "first_name": user_data.first_name,
                "last_name": user_data.last_name,
                "post": user_data.post,
                "role": user_data.role
            }
        })
        
        # After creation, generate tokens immediately
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
        # Check if user exists in public.users and has the correct role first
        user_record = supabase_db.table("users").select("id", "role").eq("email", user_data.email).execute()
        
        if not user_record.data:
            # Fallback check if user exists in auth but not yet in public.users
            # This can happen if signup succeeded but public table insert was manual
            print(f"DEBUG: User {user_data.email} not found in public.users table")
        else:
            role = user_record.data[0].get("role")
            if role != user_data.role.value:
                raise HTTPException(status_code=403, detail=f"Role mismatch: You are registered as {role}")

        # Authenticate with Supabase Auth
        auth_response = supabase_auth.auth.sign_in_with_password({
            "email": user_data.email,
            "password": user_data.password
        })

        if auth_response is None or auth_response.user is None:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        user = auth_response.user
        
        # Determine role (re-check or use previous check)
        final_role = user_data.role.value
        if user_record.data:
            final_role = user_record.data[0].get("role")

        expires = timedelta(days=30) if user_data.remember_me else None

        access_token = create_access_token(
            {"sub": user.id, "email": user.email, "role": final_role},
            expires_delta=expires
        )
        refresh_token = create_refresh_token({"sub": user.id})

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "role": final_role,
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print("LOGIN ERROR:", str(e))
        print(traceback.format_exc())
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
bearer_scheme = HTTPBearer()

@router.post("/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Security(bearer_scheme)):
    try:
        # Extract token from "Bearer <token>"
        token = credentials.credentials

        # Set the user's session then sign out — invalidates the token on Supabase side
        supabase_auth.auth.set_session(token, "")
        supabase_auth.auth.sign_out()

        return {"message": "Logged out successfully."}

    except Exception as e:
        print("LOGOUT ERROR:", str(e))
        raise HTTPException(status_code=400, detail="Logout failed")