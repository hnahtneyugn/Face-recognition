from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from src.utils.auth_utils import verify_password, create_access_token, get_current_user
from src.models import User
from datetime import datetime, timedelta


router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Đăng nhập và trả về token JWT."""
    user = await User.get_or_none(username=form_data.username)
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # Tính thời gian hết hạn và thêm vào dữ liệu
    expire = datetime.utcnow() + timedelta(minutes=30)
    access_token = create_access_token(data={"sub": user.username, "exp": expire})
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Đăng xuất (xóa token phía client)."""
    return {"message": "Logout successful, please clear token on client side"}