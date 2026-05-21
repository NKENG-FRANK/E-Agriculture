from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
from user_mannagement_service.core.security import hash_password, create_access_token, create_refresh_token
from user_mannagement_service.core.config import settings
from supabase import create_client

router = APIRouter(prefix="/auth", tags=["authentication"])
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

class UserSignup(BaseModel):
    email: EmailStr
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    post: Optional[str] = "staff"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

@router.post("/signup")
async def signup(user_data: UserSignup):
    # Optional: check if user already exists (Supabase Auth will also prevent duplicates)
    existing = supabase.table("users").select("*").eq("email", user_data.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = hash_password(user_data.password)
    
    try:
        auth_user = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "options": {
                "data": {
                    "first_name": user_data.first_name,
                    "last_name": user_data.last_name,
                    "post": user_data.post,
                    "hashed_password": hashed_password,
                    "role": "user"
                }
            }
        })
        
        # Email confirmation required
        if auth_user.session is None:
            return {
                "message": "User created. Please check your email to confirm your account.",
                "user_id": auth_user.user.id
            }
        
        # Auto-confirm enabled – return tokens immediately
        # Note: the trigger will insert into `public.users` automatically
        access_token = create_access_token({
            "sub": auth_user.user.id,
            "email": user_data.email,
            "role": "user"
        })
        refresh_token = create_refresh_token({"sub": auth_user.user.id})
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
async def login(user_data: UserLogin):
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": user_data.email,
            "password": user_data.password
        })
        user = auth_response.user
        
        # Get role from your users table (populated by trigger)
        user_record = supabase.table("users").select("role").eq("id", user.id).execute()
        role = user_record.data[0].get("role", "user") if user_record.data else "user"
        
        access_token = create_access_token({"sub": user.id, "email": user.email, "role": role})
        refresh_token = create_refresh_token({"sub": user.id})
        
        return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}
    
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid credentials")