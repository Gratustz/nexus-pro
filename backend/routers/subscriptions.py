from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from core.database import get_db
from core.security import hash_password, verify_password
from routers.auth import get_current_user
from models.user import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["Users"])


# --- Schemas ---
class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class UserProfileResponse(BaseModel):
    id: str
    email: str
    full_name: str
    plan: str
    is_active: bool
    is_verified: bool
    created_at: str


# --- Get my profile ---
@router.get("/me", response_model=UserProfileResponse)
def get_profile(
    current_user: User = Depends(get_current_user)
):
    return UserProfileResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        plan=current_user.plan,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        created_at=str(current_user.created_at)
    )


# --- Update my profile ---
@router.put("/me")
def update_profile(
    request: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if new email already exists
    if request.email and request.email != current_user.email:
        existing = db.query(User).filter(
            User.email == request.email
        ).first()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use"
            )
        current_user.email = request.email

    if request.full_name:
        current_user.full_name = request.full_name

    db.commit()
    db.refresh(current_user)

    logger.info(f"Profile updated: {current_user.email}")

    return {
        "message": "Profile updated successfully",
        "email": current_user.email,
        "full_name": current_user.full_name
    }


# --- Change password ---
@router.put("/me/password")
def change_password(
    request: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify current password
    if not verify_password(
        request.current_password,
        current_user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    # Validate new password length
    if len(request.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters"
        )

    # Update password
    current_user.hashed_password = hash_password(request.new_password)
    db.commit()

    logger.info(f"Password changed: {current_user.email}")

    return {"message": "Password changed successfully"}


# --- Deactivate account ---
@router.delete("/me")
def deactivate_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    current_user.is_active = False
    db.commit()

    logger.info(f"Account deactivated: {current_user.email}")

    return {"message": "Account deactivated successfully"}


# --- Admin — get all users ---
@router.get("/all")
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    users = db.query(User).all()

    return {
        "total": len(users),
        "users": [
            {
                "id": str(u.id),
                "email": u.email,
                "full_name": u.full_name,
                "plan": u.plan,
                "is_active": u.is_active,
                "created_at": str(u.created_at)
            }
            for u in users
        ]
    }