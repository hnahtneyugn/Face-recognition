from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from src.utils.auth_utils import get_current_admin
from src.models import Employee
from typing import List
import os
import shutil
from datetime import datetime


router = APIRouter(prefix="/employees", tags=["employees"])


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_employee(
    fullname: str,
    department: str,
    email: str,
    phone_number: str,
    face_image: UploadFile = File(...),
    current_admin: Employee = Depends(get_current_admin)
):
    """Admin tạo nhân viên mới với ảnh khuôn mặt."""
    # Đảm bảo thư mục lưu trữ ảnh tồn tại
    face_dir = "faces"
    os.makedirs(face_dir, exist_ok=True)
    
    # Tạo tên file duy nhất cho ảnh
    timestamp = int(datetime.now().timestamp())
    file_extension = face_image.filename.split(".")[-1]
    face_filename = f"employee_{timestamp}.{file_extension}"
    face_path = os.path.join(face_dir, face_filename)
    
    # Lưu ảnh vào thư mục faces/
    with open(face_path, "wb") as buffer:
        shutil.copyfileobj(face_image.file, buffer)


    try:        
        # Tạo nhân viên mới
        employee = await Employee.create(
            fullname=fullname,
            department=department,
            email=email,
            phone_number=phone_number,
            face_path=face_path
        )
        return {
            "employee_id": employee.employee_id,
            "fullname": employee.fullname,
            "department": employee.department,
            "email": employee.email,
            "phone_number": employee.phone_number,
            "face_path": employee.face_path
        }
    except Exception as e:
        # Nếu có lỗi, xóa ảnh đã lưu
        if os.path.exists(face_path):
            os.remove(face_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating employee: {str(e)}"
        )


@router.get("/", response_model=List[dict])
async def get_employees(current_admin: Employee = Depends(get_current_admin)):
    """Admin xem danh sách tất cả nhân viên."""
    employees = await Employee.all()
    return [
        {
            "employee_id": employee.employee_id,
            "fullname": employee.fullname,
            "department": employee.department,
            "email": employee.email,
            "phone_number": employee.phone_number,
            "face_path": employee.face_path,
        }
        for employee in employees
    ]


@router.get("/{employee_id}", response_model=dict)
async def get_employee(employee_id: int, current_admin: Employee = Depends(get_current_admin)):
    """Admin xem thông tin một nhân viên cụ thể."""
    employee = await Employee.get_or_none(employee_id=employee_id).prefetch_related("users")
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    return {
        "employee_id": employee.employee_id,
        "fullname": employee.fullname,
        "department": employee.department,
        "email": employee.email,
        "phone_number": employee.phone_number,
        "face_path": employee.face_path,
        "users": [
            {
                "user_id": user.user_id,
                "username": user.username,
                "role": user.role,
            }
            for user in employee.users
        ]
    }


@router.put("/{employee_id}")
async def update_employee(
    employee_id: int,
    fullname: str = None,
    department: str = None,
    email: str = None,
    phone_number: str = None,
    face_image: UploadFile = File(...),
    current_admin: Employee = Depends(get_current_admin)
):
    """Admin cập nhật thông tin nhân viên."""
    employee = await Employee.get_or_none(employee_id=employee_id)
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    # Cập nhật các trường nếu được cung cấp
    if fullname:
        employee.fullname = fullname

    if department:
        employee.department = department

    if email:
        # Kiểm tra email mới (nếu có) không trùng
        existing_employee = await Employee.get_or_none(email=email)
        if existing_employee and existing_employee.employee_id != employee_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use"
            )
        employee.email = email
    
    if phone_number:
        # Kiểm tra số điện thoại mới (nếu có) không trùng
        existing_employee = await Employee.get_or_none(phone_number=phone_number)
        if existing_employee and existing_employee.employee_id != employee_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already in use"
            )
        employee.phone_number = phone_number

    if face_image:
        # Đảm bảo thư mục lưu trữ ảnh tồn tại
        face_dir = "faces"
        os.makedirs(face_dir, exist_ok=True)
        
        # Tạo tên file duy nhất cho ảnh
        timestamp = int(datetime.now().timestamp())
        file_extension = face_image.filename.split(".")[-1]
        face_filename = f"employee_{timestamp}.{file_extension}"
        face_path = os.path.join(face_dir, face_filename)
        
        # Lưu ảnh mới
        with open(face_path, "wb") as buffer:
            shutil.copyfileobj(face_image.file, buffer)

        try:
            # Xóa ảnh cũ nếu có
            if employee.face_path and os.path.exists(employee.face_path):
                os.remove(employee.face_path)
            
            # Cập nhật đường dẫn ảnh mới
            employee.face_path = face_path
        except Exception as e:
            # Nếu có lỗi, xóa ảnh mới vừa lưu
            if os.path.exists(face_path):
                os.remove(face_path)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error updating avatar: {str(e)}"
            )
        
    await employee.save()
    return {"message": "Employee updated successfully"}


@router.delete("/{employee_id}")
async def delete_employee(employee_id: int, current_admin: Employee = Depends(get_current_admin)):
    """Admin xóa nhân viên."""
    employee = await Employee.get_or_none(employee_id=employee_id)
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    await employee.delete()
    return {"message": "Employee deleted successfully"}