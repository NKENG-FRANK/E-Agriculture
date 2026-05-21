from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict, Any
from user_mannagement_service.core.security import decode_token
from user_mannagement_service.core.config import settings
from supabase import create_client

# Initialize Supabase client
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

security = HTTPBearer(auto_error=False)

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Dict[str, Any]:
    """Level 1: Basic authentication - just needs a valid token"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    payload = decode_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    
    # Verify token with Supabase (optional but recommended)
    try:
        user = supabase.auth.get_user(token)
        return {"id": user.user.id, "email": user.user.email, "role": user.user.user_metadata.get("role", "user")}
    except Exception:
        # Fallback to JWT payload if Supabase verification fails
        return {"id": payload.get("sub"), "email": payload.get("email"), "role": payload.get("role", "user")}

async def get_current_admin_user(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Level 2: Admin authentication - requires admin role"""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user

async def get_current_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[Dict[str, Any]]:
    """Level 3: Optional authentication - works with or without token"""
    if not credentials:
        return None
    
    token = credentials.credentials
    payload = decode_token(token)
    
    if not payload:
        return None
    
    return {"id": payload.get("sub"), "email": payload.get("email"), "role": payload.get("role", "user")}

# Helper: Check if user has specific permission
def require_permission(permission: str):
    """Level 4: Permission-based authentication"""
    def dependency(current_user: Dict[str, Any] = Depends(get_current_user)):
        user_permissions = current_user.get("permissions", [])
        if permission not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission '{permission}' required"
            )
        return current_user
    return dependency