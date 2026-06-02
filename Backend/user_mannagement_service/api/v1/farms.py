from fastapi import APIRouter, HTTPException, Security, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
from core.config import settings
from supabase import create_client

router = APIRouter(prefix="/farms", tags=["farms"])
security = HTTPBearer()

supabase_db = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


# ── Schemas ───────────────────────────────────────────────────────────────────

class FarmCreate(BaseModel):
    farm_name: str
    owner_id: str
    location: Optional[str] = None
    farm_type: Optional[str] = None        # 'Crop Farm', 'Poultry Farm', etc.
    account_status: Optional[str] = "active"


class FarmUpdate(BaseModel):
    farm_name: Optional[str] = None
    owner_id: Optional[str] = None
    location: Optional[str] = None
    farm_type: Optional[str] = None


class FarmStatusUpdate(BaseModel):
    account_status: str  # "active" | "maintenance" | "critical"


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/")
async def list_farms(
    search: Optional[str] = Query(None, description="Search by farm name or location"),
    owner_id: Optional[str] = Query(None, description="Filter by owner"),
    status: Optional[str] = Query(None, description="Filter by status"),
    credentials: HTTPAuthorizationCredentials = Security(security),
):
    """
    Returns all farms with owner details.
    Supports filtering by owner_id, status, or search term.
    """
    try:
        query = supabase_db.table("farms").select(
            "*, owners(id, first_name, last_name, email)"
        )

        if owner_id:
            query = query.eq("owner_id", owner_id)

        if status:
            query = query.eq("account_status", status)

        if search:
            query = query.or_(
                f"farm_name.ilike.%{search}%,"
                f"location.ilike.%{search}%"
            )

        result = query.execute()
        return result.data

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{farm_id}")
async def get_farm(
    farm_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security),
):
    """Get a single farm by ID with owner details."""
    try:
        result = supabase_db.table("farms").select(
            "*, owners(id, first_name, last_name, email)"
        ).eq("id", farm_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Farm not found")

        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/", status_code=201)
async def create_farm(
    farm_data: FarmCreate,
    credentials: HTTPAuthorizationCredentials = Security(security),
):
    """Create a new farm and link it to an owner."""
    try:
        # Verify owner exists
        owner = supabase_db.table("owners").select("id").eq(
            "id", farm_data.owner_id
        ).execute()
        if not owner.data:
            raise HTTPException(status_code=404, detail="Owner not found")

        result = supabase_db.table("farms").insert({
            "farm_name": farm_data.farm_name,
            "owner_id": farm_data.owner_id,
            "location": farm_data.location,
            "farm_type": farm_data.farm_type,
            "account_status": farm_data.account_status,
        }).execute()

        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{farm_id}")
async def update_farm(
    farm_id: str,
    farm_data: FarmUpdate,
    credentials: HTTPAuthorizationCredentials = Security(security),
):
    """Update farm details."""
    try:
        updates = farm_data.model_dump(exclude_none=True)
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")

        result = supabase_db.table("farms").update(updates).eq(
            "id", farm_id
        ).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Farm not found")

        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{farm_id}/status")
async def update_farm_status(
    farm_id: str,
    status_data: FarmStatusUpdate,
    credentials: HTTPAuthorizationCredentials = Security(security),
):
    """Update farm network status — active, maintenance, or critical."""
    try:
        allowed = ["active", "maintenance", "critical"]
        if status_data.account_status not in allowed:
            raise HTTPException(
                status_code=400,
                detail=f"status must be one of {allowed}"
            )

        result = supabase_db.table("farms").update({
            "account_status": status_data.account_status
        }).eq("id", farm_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Farm not found")

        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{farm_id}", status_code=204)
async def delete_farm(
    farm_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security),
):
    """Delete a farm record."""
    try:
        result = supabase_db.table("farms").delete().eq("id", farm_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Farm not found")
        return

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))