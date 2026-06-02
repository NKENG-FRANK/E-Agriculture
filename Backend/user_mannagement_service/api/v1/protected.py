from fastapi import APIRouter, Depends
from typing import Optional, Annotated
from core.dependencies import get_current_user, get_current_admin_user, get_current_optional_user, require_permission

router = APIRouter(prefix="/protected", tags=["protected"])

# SECTION 1: Basic user info - requires login
@router.get("/user/profile")
async def get_user_profile(current_user: Annotated[dict, Depends(get_current_user)]):
    """Level 1 Auth: Must be logged in"""
    return {
        "message": "Your profile data",
        "user_id": current_user["id"],
        "email": current_user["email"],
        "section": "User Profile (requires authentication)"
    }

# SECTION 2: Admin dashboard - requires admin role
@router.get("/admin/dashboard")
async def admin_dashboard(current_user: Annotated[dict, Depends(get_current_admin_user)]):
    """Level 2 Auth: Admin only"""
    return {
        "message": "Welcome to admin dashboard",
        "admin_data": {
            "total_users": 123,
            "total_orders": 456
        },
        "section": "Admin Dashboard (admin only)"
    }

# SECTION 3: Public data with optional user context
@router.get("/public/data")
async def get_public_data(current_user: Optional = Depends(get_current_optional_user)):
    """Level 3 Auth: Works with or without login"""
    response = {
        "message": "Public data anyone can see",
        "data": {"item1": "value1", "item2": "value2"},
        "section": "Public Data (no auth needed)"
    }
    
    if current_user:
        response["user_context"] = f"Logged in as {current_user['email']}"
        response["personalized"] = "Here's your personalized content"
    
    return response

# SECTION 4: Permission-based access
@router.get("/admin/users/{user_id}")
async def get_user_details(
    user_id: str, 
    current_user = Depends(require_permission("users:read"))
):
    """Level 4 Auth: Specific permission required"""
    return {
        "message": f"Details for user {user_id}",
        "permission_used": "users:read",
        "section": "User Details (requires users:read permission)"
    }