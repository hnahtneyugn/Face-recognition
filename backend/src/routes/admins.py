from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Request, Form
from src.utils.auth_utils import get_current_admin, get_password_hash
from src.utils.file_utils import save_face_image, remove_face_image
from src.utils.filter_utils import attendance_filters, user_filters, get_user_by_id
from src.utils.validate_utils import validate_data

from src.models import User, Attendance
from typing import List


router = APIRouter(prefix="/admins", tags=["admins"])


@router.get("/", response_model=List[dict])
async def get_users(
    fullname: str = None,
    email: str = None,
    department: str = None,
    role: str = None,
    current_admin: User = Depends(get_current_admin)
):
    """Admin xem danh sách tất cả user."""
    filters = user_filters(fullname, email, department, role)

    users = await User.filter(**filters).order_by("user_id")

    return [
        {
            "user_id": user.user_id,
            "fullname": user.fullname,
            "email": user.email,
            "department": user.department,
            "role": user.role,
            "face_path": f"/{user.face_path}" if user.face_path else None
        }
        for user in users
    ]


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_user(
    username: str = Form(...),
    password: str = Form(...),
    role: str = Form(...),
    fullname: str = Form(...),
    email: str = Form(...),
    department: str = Form(...),
    face_image: UploadFile = File(...),
    # current_admin: User = Depends(get_current_admin)
):
    """Admin tạo user mới."""
    print(f"Creating user: {username}, {fullname}, {email}, {department}, {role}")
    print(f"Received face image: {face_image.filename}, {face_image.content_type}, size: {face_image.size}")
    
    try:
        await validate_data(
            username=username,
            password=password,
            role=role,
            email=email,
        )
        
        face_path = save_face_image(file=face_image, folder="faces")
        print(f"Saved face image to: {face_path}")

        try:
            user = await User.create(
                username=username,
                password_hash=get_password_hash(password),
                role=role,
                fullname=fullname,
                email=email,
                department=department,
                face_path=face_path
            )

            # Tạo URL đầy đủ cho frontend
            face_url = f"/{face_path}"  # Trả về đường dẫn tương đối để frontend dễ truy cập
            print(f"User created: {user.user_id}, face_path: {face_url}")

            response_data = {
                "user_id": user.user_id,
                "username": user.username,
                "role": user.role,
                "fullname": user.fullname,
                "email": user.email,
                "department": user.department,
                "face_path": face_url
            }
            print(f"Returning response: {response_data}")
            return response_data
            
        except Exception as e:
            print(f"Error creating user in database: {str(e)}")
            remove_face_image(path=face_path)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error creating user: {str(e)}"
            )
    except Exception as e:
        print(f"Error in create_user endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error in user creation process: {str(e)}"
        )
    

@router.put("/{user_id}")
async def update_user(
    user_id: int,
    username: str = Form(None),
    password: str = Form(None),
    role: str = Form(None),
    fullname: str = Form(None),
    email: str = Form(None),
    department: str = Form(None),
    face_image: UploadFile = File(None),
    current_admin: User = Depends(get_current_admin)
):
    """Admin cập nhật thông tin user."""
    print(f"Updating user ID {user_id}")
    print(f"Data: username={username}, role={role}, fullname={fullname}, email={email}, department={department}")
    print(f"Face image: {face_image.filename if face_image else 'None'}")
    
    user = await get_user_by_id(user_id=user_id)
    
    await validate_data(
        username=username,
        password=password,
        role=role,
        email=email,
        user_id=user_id
    )
    if username:
        user.username = username

    if password:
        user.password_hash = get_password_hash(password)

    if role:
        user.role = role

    if fullname:
        user.fullname = fullname

    if email:
        user.email = email

    if department:
        user.department = department

    face_url = None
    if face_image:        
        try:
            face_path = save_face_image(file=face_image, folder="faces")
            remove_face_image(path=user.face_path)
            user.face_path = face_path
            face_url = f"/{face_path}"
            print(f"Updated face_path to: {face_path}")

        except Exception as e:
            print(f"Error updating face image: {str(e)}")
            if 'face_path' in locals():
                remove_face_image(path=face_path)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error updating user: {str(e)}"
            )

    await user.save()
    print(f"User {user_id} updated successfully")
    return {
        "message": "User updated successfully",
        "face_path": face_url
    }


@router.delete("/{user_id}")
async def delete_user(user_id: int, current_admin: User = Depends(get_current_admin)
                      ):
    """Admin xóa user."""
    user = await get_user_by_id(user_id=user_id)

    try:
        remove_face_image(path=user.face_path)
        await user.delete()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting user: {str(e)}"
        )
    
    return {"message": "User deleted successfully"}


@router.get("/attendance", response_model=List[dict])
async def get_daily_attendance(
    year: int = None,
    month: int = None,
    day: int = None,
    status: str = None,
    fullname: str = None,
    email: str = None,
    department: str = None,
    current_admin: User = Depends(get_current_admin)
):
    """Admin xem danh sách điểm danh hàng ngày."""
    filters = user_filters(fullname=fullname, email=email, department=department)
    
    users = await User.filter(**filters).all()

    print(users)
    attendances = []
    for user in users:
        user_attendances = await Attendance.filter(user=user).order_by("-date").prefetch_related("user")
        attendances.extend(user_attendances)

    filtered_attendances = [
        att for att in attendances if attendance_filters(att, year, month, day, status)
    ]

    return [
        {
            "attendance_id": att.attendance_id,
            "user_id": att.user.user_id,
            "fullname": att.user.fullname,
            "email": att.user.email,
            "department": att.user.department,
            "date": att.date,
            "time": att.time,
            "status": att.status
        }
        for att in filtered_attendances
    ]


@router.get("/attendance/{user_id}", response_model=List[dict])
async def get_user(
    user_id: int,
    year: int = None,
    month: int = None,
    day: int = None,
    status: str = None,
    current_admin: User = Depends(get_current_admin)
):
    """Admin xem thông tin một user cụ thể."""
    user = await get_user_by_id(user_id=user_id)
    
    attendances = await Attendance.filter(user=user).order_by("-date")

    filtered_attendances = [
        att for att in attendances if attendance_filters(att, year, month, day, status)
    ]

    return [
        {
            "attendance_id": att.attendance_id,
            "date": att.date,
            "time": att.time,
            "status": att.status
        }
        for att in filtered_attendances
    ]