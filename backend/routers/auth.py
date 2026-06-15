from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from pydantic import BaseModel, EmailStr
from core.database import get_db
from core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_email_from_token
)
from core.config import settings
from models.user import User, PlanType
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# --- Schemas ---
class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user_email: str
    user_name: str
    plan: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    plan: str
    is_active: bool
    is_verified: bool


# --- Get current user from token ---
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    email = get_email_from_token(token)

    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )

    return user


# --- Register ---
@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    # Check if email already exists
    existing = db.query(User).filter(
        User.email == request.email
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
    user = User(
        full_name=request.full_name,
        email=request.email,
        hashed_password=hash_password(request.password),
        plan=PlanType.FREE
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    logger.info(f"New user registered: {user.email}")

    return {
        "message": "Account created successfully",
        "email": user.email,
        "plan": user.plan
    }


# --- Login ---
@router.post("/login", response_model=LoginResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # Find user
    user = db.query(User).filter(
        User.email == form_data.username
    ).first()

    if not user or not verify_password(
        form_data.password, user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )

    # Create token
    token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    )

    logger.info(f"User logged in: {user.email}")

    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user_email=user.email,
        user_name=user.full_name,
        plan=user.plan
    )


# --- Get current user profile ---
@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        plan=current_user.plan,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified
    )


# --- Logout ---
@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    logger.info(f"User logged out: {current_user.email}")
    return {"message": "Logged out successfully"}