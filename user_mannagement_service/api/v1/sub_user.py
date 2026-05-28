from fastapi import APIRouter, HTTPException, Security, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from core.config import settings
from supabase import create_client

router = APIRouter(prefix="/sub-users", tags=["sub-users"])
security = HTTPBearer()

supabase_db = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


# ── Schemas ───────────────────────────────────────────────────────────────────

class SubUserSections(BaseModel):
    sub_user_id: str
    owner_id: str
    sections: List[str] = []  # ["Crops", "Poultry", "Aquaculture"]


class SubUserUpdate(BaseModel):
    full_name: Optional[str] = None
    sections: Optional[List[str]] = None


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/")
async def list_sub_users(
    owner_id: Optional[str] = Query(None, description="Filter by owner"),
    credentials: HTTPAuthorizationCredentials = Security(security),
):
    """
    Returns all sub-users with their owner details.
    Pass ?owner_id=xxx to scope to a specific owner.
    """
    try:
        query = supabase_db.table("sub_users").select(
            "*, owners(id, first_name, last_name, email)"
        ).order("created_at", desc=True)

        if owner_id:
            query = query.eq("owner_id", owner_id)

        result = query.execute()
        return result.data

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/sections", status_code=200)
async def assign_sections(
    data: SubUserSections,
    credentials: HTTPAuthorizationCredentials = Security(security),
):
    """
    Second call after POST /auth/signup.
    handle_new_user already inserted the base sub_user record —
    this call attaches the owner_id and assigned sections.
    """
    try:
        result = supabase_db.table("sub_users").update({
            "owner_id": data.owner_id,
            "sections": data.sections,
        }).eq("id", data.sub_user_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Sub-user not found")

        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{sub_user_id}")
async def update_sub_user(
    sub_user_id: str,
    sub_user_data: SubUserUpdate,
    credentials: HTTPAuthorizationCredentials = Security(security),
):
    """Update sub-user full name and/or assigned sections."""
    try:
        updates = sub_user_data.model_dump(exclude_none=True)
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")

        result = supabase_db.table("sub_users").update(updates).eq(
            "id", sub_user_id
        ).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Sub-user not found")

        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{sub_user_id}", status_code=204)
async def delete_sub_user(
    sub_user_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security),
):
    """
    Delete a sub-user record and their Supabase Auth account if linked.
    """
    try:
        sub_user = supabase_db.table("sub_users").select("user_id, email").eq(
            "id", sub_user_id
        ).execute()

        if not sub_user.data:
            raise HTTPException(status_code=404, detail="Sub-user not found")

        user_id = sub_user.data[0].get("user_id")

        # Delete from sub_users table
        supabase_db.table("sub_users").delete().eq("id", sub_user_id).execute()

        # Delete their auth account if they have one
        if user_id:
            try:
                supabase_db.auth.admin.delete_user(user_id)
            except Exception as auth_err:
                print(f"AUTH DELETE ERROR: {auth_err}")

        return

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))