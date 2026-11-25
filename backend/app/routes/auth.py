from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from datetime import timedelta
import logging

from ..database import get_db
from ..models import User
from ..schemas import UserCreate, UserResponse, Token
from ..utils.security import verify_password, get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    clean_email = user.email.strip().lower() if user.email else ""
    clean_username = user.username.strip() if user.username else ""
    clean_password = user.password

    logger.info(f"📝 Registration attempt: username={clean_username}, email={clean_email}")
    
    if not clean_email or not clean_username or not clean_password:
        raise HTTPException(status_code=400, detail="Email, username, and password are required")

    db_user = db.query(User).filter(func.lower(User.email) == clean_email).first()
    if db_user:
        logger.warning(f"⚠️  Email already registered: {clean_email}")
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_username = db.query(User).filter(func.lower(User.username) == clean_username.lower()).first()
    if db_username:
        logger.warning(f"⚠️  Username already taken: {clean_username}")
        raise HTTPException(status_code=400, detail="Username already taken")
        
    try:
        hashed_password = get_password_hash(clean_password)
        new_user = User(email=clean_email, username=clean_username, hashed_password=hashed_password)
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        logger.info(f"✅ User registered successfully: {clean_username}")
        return new_user
    except Exception as e:
        logger.error(f"❌ Registration error: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    identifier = form_data.username.strip() if form_data.username else ""
    logger.info(f"🔐 Login attempt: identifier={identifier}")
    
    if not identifier or not form_data.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username/email and password are required",
        )

    user = db.query(User).filter(
        or_(
            func.lower(User.username) == identifier.lower(),
            func.lower(User.email) == identifier.lower()
        )
    ).first()

    if not user:
        logger.warning(f"⚠️  User not found: {identifier}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    pwd_match = verify_password(form_data.password, user.hashed_password)
    logger.info(f"🔐 Password verification for {identifier}: {pwd_match}")
    
    if not pwd_match:
        logger.warning(f"⚠️  Password mismatch for user: {identifier}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    logger.info(f"✅ Login successful: {user.username}")
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
