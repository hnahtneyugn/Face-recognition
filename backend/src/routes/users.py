from fastapi import APIRouter, HTTPException, status, Depends
from src.utils.auth_utils import get_password_hash, get_current_user, get_current_admin
from src.models import User, Employee
from typing import List


router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=dict)
async def get_my_info(current_user: User = Depends(get_current_user)):
    """Người dùng xem thông tin của chính mình."""
    return {
        "user_id": current_user.user_id,
        "username": current_user.username,
        "role": current_user.role,
        "employee_id": current_user.employee.employee_id,
        "employee_name": current_user.employee.fullname,
        "employee_department": current_user.employee.department,
        "employee_email": current_user.employee.email,
        "employee_phone": current_user.employee.phone_number,
        "avatar_url": current_user.employee.avatar_url
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_user(
    employee_id: int,
    username: str,
    password: str,
    role: str = "user",
    current_admin: User = Depends(get_current_admin)
):
    """Admin tạo user mới."""
    # Kiểm tra employee tồn tại
    employee = await Employee.get_or_none(employee_id=employee_id)
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    # Kiểm tra username đã tồn tại
    existing_user = await User.filter(username=username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    # Kiểm tra username hợp lệ
    if not username.isalnum() or len(username) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be alphanumeric and at least 8 characters long"
        )
    
    # Kiểm tra password hợp lệ
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long"
        )

    # Kiểm tra role hợp lệ
    if role not in ["user", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be 'user' or 'admin'"
        )
    
    # Tạo user mới
    password_hash = get_password_hash(password)
    user = await User.create(
        username=username,
        password_hash=password_hash,
        employee=employee,
        role=role
    )
    return {"user_id": user.user_id, "username": user.username, "role": user.role}


@router.get("/", response_model=List[dict])
async def get_users(current_admin: User = Depends(get_current_admin)):
    """Admin xem danh sách tất cả user."""
    users = await User.all().prefetch_related("employee")
    return [
        {
            "user_id": user.user_id,
            "username": user.username,
            "role": user.role,
            "employee_id": user.employee.employee_id,
            "employee_name": user.employee.fullname
        }
        for user in users
    ]


@router.get("/{user_id}", response_model=dict)
async def get_user(user_id: int, current_admin: User = Depends(get_current_admin)):
    """Admin xem thông tin một user cụ thể."""
    user = await User.get_or_none(user_id=user_id).prefetch_related("employee")
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {
        "user_id": user.user_id,
        "username": user.username,
        "role": user.role,
        "employee_id": user.employee.employee_id,
        "employee_name": user.employee.fullname,
        "employee_department": user.employee.department,
        "employee_email": user.employee.email,
        "employee_phone": user.employee.phone_number,
        "avatar_url": user.employee.avatar_url
    }


@router.put("/{user_id}")
async def update_user(
    user_id: int,
    username: str = None,
    password: str = None,
    role: str = None,
    current_admin: User = Depends(get_current_admin)
):
    """Admin cập nhật thông tin user."""
    user = await User.get_or_none(user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Kiểm tra username mới (nếu có) không trùng
    if username:
        if username != user.username:
            existing_user = await User.filter(username=username).first()
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already exists"
                )
            if not username.isalnum() or len(username) < 8:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username must be alphanumeric and at least 8 characters long"
                )
            user.username = username
    
    # Cập nhật password (nếu có)
    if password:
        user.password_hash = get_password_hash(password)
    
    # Cập nhật role (nếu có)
    if role:
        if role not in ["user", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role must be 'user' or 'admin'"
            )
        user.role = role
    
    await user.save()
    return {"message": "User updated successfully"}


@router.delete("/{user_id}")
async def delete_user(user_id: int, current_admin: User = Depends(get_current_admin)):
    """Admin xóa user."""
    user = await User.get_or_none(user_id=user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    await user.delete()
    return {"message": "User deleted successfully"}
