from fastapi import APIRouter, HTTPException, Security, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional
from core.config import settings
from supabase import create_client

router = APIRouter(prefix="/owners", tags=["owners"])
security = HTTPBearer()

supabase_db = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


# ── Schemas ───────────────────────────────────────────────────────────────────

class OwnerCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    account_status: Optional[str] = "active"


class OwnerUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None


class StatusUpdate(BaseModel):
    account_status: str  # "active" | "suspended"


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/")
async def list_owners(
    search: Optional[str] = Query(None, description="Search by name or email"),
    credentials: HTTPAuthorizationCredentials = Security(security),
):
    """
    Returns all owners with their managed farm count.
    Optionally filter by name or email via ?search=alice
    """
    try:
        # Base query — join farms to count managed_farms per owner
        query = supabase_db.table("owners").select(
            "*, farms(id)"
        )

        if search:
            query = query.or_(
                f"first_name.ilike.%{search}%,"
                f"last_name.ilike.%{search}%,"
                f"email.ilike.%{search}%"
            )

        result = query.execute()

        # Compute managed_farms count from joined farms
        owners = []
        for owner in result.data:
            farms = owner.pop("farms", [])
            owner["managed_farms"] = len(farms) if farms else 0
            owners.append(owner)

        return owners

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/", status_code=201)
async def create_owner(
    owner_data: OwnerCreate,
    credentials: HTTPAuthorizationCredentials = Security(security),
):
    """Create a new farm owner record."""
    try:
        # Check for duplicate email
        existing = supabase_db.table("owners").select("id").eq(
            "email", owner_data.email
        ).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Email already exists")

        result = supabase_db.table("owners").insert({
            "first_name": owner_data.first_name,
            "last_name": owner_data.last_name,
            "email": owner_data.email,
            "phone": owner_data.phone,
            "account_status": owner_data.account_status,
        }).execute()

        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{owner_id}")
async def update_owner(
    owner_id: str,
    owner_data: OwnerUpdate,
    credentials: HTTPAuthorizationCredentials = Security(security),
):
    """Update owner details."""
    try:
        # Only send fields that were actually provided
        updates = owner_data.model_dump(exclude_none=True)
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")

        result = supabase_db.table("owners").update(updates).eq(
            "id", owner_id
        ).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Owner not found")

        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{owner_id}/status")
async def update_owner_status(
    owner_id: str,
    status_data: StatusUpdate,
    credentials: HTTPAuthorizationCredentials = Security(security),
):
    """Suspend or activate an owner account."""
    try:
        allowed = ["active", "suspended"]
        if status_data.account_status not in allowed:
            raise HTTPException(
                status_code=400,
                detail=f"status must be one of {allowed}"
            )

        result = supabase_db.table("owners").update({
            "account_status": status_data.account_status
        }).eq("id", owner_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Owner not found")

        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{owner_id}/reset-password")
async def reset_owner_password(
    owner_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security),
):
    """Send a password reset email to the owner."""
    try:
        owner = supabase_db.table("owners").select("email").eq(
            "id", owner_id
        ).execute()

        if not owner.data:
            raise HTTPException(status_code=404, detail="Owner not found")

        email = owner.data[0]["email"]

        supabase_db.auth.admin.generate_link({
            "type": "recovery",
            "email": email,
        })

        return {"message": f"Password reset email sent to {email}"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{owner_id}", status_code=204)
async def delete_owner(
    owner_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security),
):
    """Delete an owner record."""
    try:
        result = supabase_db.table("owners").delete().eq("id", owner_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Owner not found")
        return

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))