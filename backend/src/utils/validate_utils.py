from fastapi import HTTPException, status
from src.models import User
from typing import Optional


async def validate_data(
        username: Optional[str] = None,
        password: Optional[str] = None,
        email: Optional[str] = None,
        role: Optional[str] = None,
        fullname: Optional[str] = None,
        department: Optional[str] = None
):
    if username:
        if await User.filter(username=username).exists():
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
        if await User.filter(email=email).exists():
            raise HTTPException(
                status_code=400,
                detail="Email already exists"
            )
        
        if not email or not "@" in email or not "." in email:
            raise HTTPException(
                status_code=400,
                detail="Invalid email format"
            )

    if fullname:
        if len(fullname) < 2:
            raise HTTPException(
                status_code=400,
                detail="Fullname must be at least 2 characters long"
            )

    if department:
        if len(department) < 2:
            raise HTTPException(
                status_code=400,
                detail="Department must be at least 2 characters long"
            )