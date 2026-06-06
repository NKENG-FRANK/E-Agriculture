from datetime import timedelta
from fastapi import APIRouter, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum
from core.security import create_access_token, create_refresh_token
from core.config import settings
from supabase import create_client
from models.user import UserBookConsultation

router = APIRouter(prefix="/auth", tags=["authentication"])
bearer_scheme = HTTPBearer()

# ── Single client — service role for ALL operations ───────────────────────────
# Why service role only:
# 1. No set_auth crash (realtime socket not used)
# 2. No email confirmation needed (admin.create_user)
# 3. Full DB access bypassing RLS
# 4. Simpler — one client, one key, no confusion
from supabase import create_client, ClientOptions

# This client uses the service role key for full DB access and admin auth operations
# We disable realtime to avoid the set_auth bug
supabase = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE_KEY,
    options=ClientOptions(realtime={"auto_reconnect": False})
)


# ── Schemas ───────────────────────────────────────────────────────────────────

class UserRole(str, Enum):
    admin = "admin"
    owner = "owner"
    sub_user = "sub_user"


class UserSignup(BaseModel):
    email: EmailStr
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    post: Optional[str] = "staff"
    role: Optional[str] = "sub_user"
    phone: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str
    role: UserRole
    remember_me: bool = False


# ── Endpoints ─────────────────────────────────────────────────────────────────

# Presentation Bypass Users
PRESENTATION_USERS = {
    "tabouguiangnowa.yoancabrel@ictuniversity.edu.cm": {"password": "admin123", "role": "admin", "id": "00000000-0000-0000-0000-000000000001"},
    "fnkeng52@gmail.com": {"password": "owner123", "role": "owner", "id": "00000000-0000-0000-0000-000000000002"},
    "subuser@sfms.com": {"password": "subuser123", "role": "sub_user", "id": "00000000-0000-0000-0000-000000000003"},
}

@router.post("/book-consultation")
async def book_consultation(consultation_data: UserBookConsultation):
    try:
        supabase.table("consultations").insert({
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
    # 1. Check duplicate email in public.users
    existing = supabase.table("users").select("id").eq(
        "email", user_data.email
    ).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")

    try:
        # 2. Create in auth.users
        # The Supabase Trigger (handle_new_user) will automatically:
        # - Insert into public.users
        # - Insert into public.owners OR public.sub_users based on role
        auth_user = supabase.auth.admin.create_user({
            "email": user_data.email,
            "password": user_data.password,
            "email_confirm": True,
            "user_metadata": {
                "first_name": user_data.first_name,
                "last_name": user_data.last_name,
                "post": user_data.post,
                "role": user_data.role,
                "phone": user_data.phone,
            }
        })

        if not auth_user.user:
            raise HTTPException(status_code=400, detail="Failed to create user")

        uid = auth_user.user.id

        # 3. Issue tokens immediately
        access_token = create_access_token({
            "sub": uid,
            "email": user_data.email,
            "role": user_data.role,
        })
        refresh_token = create_refresh_token({"sub": uid})

        return {
            "message": "Account created successfully.",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "role": user_data.role,
        }

    except HTTPException:
        raise
    except Exception as e:
        print("SIGNUP ERROR:", str(e))
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
async def login(user_data: UserLogin):
    try:
        # 0. Presentation Bypass Logic
        if user_data.email in PRESENTATION_USERS:
            p_user = PRESENTATION_USERS[user_data.email]
            if p_user["password"] == user_data.password and p_user["role"] == user_data.role.value:
                print(f"PRESENTATION BYPASS: Logged in as {user_data.email}")
                uid = p_user["id"]
                role = p_user["role"]
                
                expires = timedelta(days=30) if user_data.remember_me else None
                access_token = create_access_token(
                    {"sub": uid, "email": user_data.email, "role": role},
                    expires_delta=expires
                )
                refresh_token = create_refresh_token({"sub": uid})

                return {
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "token_type": "bearer",
                    "role": role,
                }

        # 1. Authenticate via service role — no set_auth crash
        auth_response = supabase.auth.sign_in_with_password({
            "email": user_data.email,
            "password": user_data.password,
        })

        if not auth_response or not auth_response.user:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        user = auth_response.user

        # 2. Fetch role from public.users
        user_record = supabase.table("users").select("role").eq(
            "id", user.id
        ).execute()

        if not user_record.data:
            raise HTTPException(
                status_code=404,
                detail="User profile not found. Contact your administrator."
            )

        db_role = user_record.data[0].get("role")

        # 3. Enforce role match
        if db_role != user_data.role.value:
            raise HTTPException(
                status_code=403,
                detail=f"Role mismatch — your account role is '{db_role}'"
            )

        # 4. Issue tokens
        expires = timedelta(days=30) if user_data.remember_me else None
        access_token = create_access_token(
            {"sub": user.id, "email": user.email, "role": db_role},
            expires_delta=expires
        )
        refresh_token = create_refresh_token({"sub": user.id})

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "role": db_role,
        }

    except HTTPException:
        raise
    except Exception as e:
        print("LOGIN ERROR:", str(e))
        raise HTTPException(status_code=401, detail="Invalid credentials")


@router.post("/logout")
async def logout(
    credentials: HTTPAuthorizationCredentials = Security(bearer_scheme)
):
    try:
        token = credentials.credentials
        # Admin sign out — invalidates the token server-side correctly
        supabase.auth.admin.sign_out(token)
        return {"message": "Logged out successfully."}
    except Exception as e:
        print("LOGOUT ERROR:", str(e))
        raise HTTPException(status_code=400, detail="Logout failed")