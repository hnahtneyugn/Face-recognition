from fastapi import HTTPException, status
from src.models import User
from typing import Optional


async def validate_data(
        username: Optional[str] = None,
        password: Optional[str] = None,
        email: Optional[str] = None,
        role: Optional[str] = None,
        user_id: Optional[int] = None
):
    if username:
        q = User.filter(username=username)
        if user_id:
            q = q.exclude(user_id=user_id)
        if await q.exists():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists"
            )
    
        if not username.isalnum() or len(username) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username must be alphanumeric and at least 8 characters long"
            )
    
    if password:
        if len(password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters long"
            )
    
    if role:
        if role not in ["user", "admin"]:
            raise HTTPException(
                status_code=400,
                detail="Role must be 'user' or 'admin'"
            )
    
    if email:
        q = User.filter(email=email)
        if user_id:
            q = q.exclude(user_id=user_id)
        if await q.exists():
            raise HTTPException(
                status_code=400,
                detail="Email already exists"
            )