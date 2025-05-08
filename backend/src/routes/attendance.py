from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from src.utils.auth_utils import get_current_user, get_current_admin
from src.models import Attendance, User
from datetime import datetime, time
from deepface import DeepFace
import os
import shutil
from typing import List


router = APIRouter(prefix="/attendance", tags=["attendance"])


@router.post("/")
async def record_attendance(
    face_image: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """User điểm danh với ảnh khuôn mặt."""
    temp_dir = "temp"
    os.makedirs(temp_dir, exist_ok=True)

    timestamp = int(datetime.now().timestamp())
    file_extension = face_image.filename.split(".")[-1]
    temp_filename = f"temp_{timestamp}.{file_extension}"
    temp_path = os.path.join(temp_dir, temp_filename)

    # Lưu ảnh vào thư mục temp/
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(face_image.file, buffer)

    try:
        user = await User.get_or_none(user_id=current_user.user_id).prefetch_related("employee")
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        face_path = user.employee.face_path  # Đường dẫn ảnh đã lưu
        try:
            result = DeepFace.verify(
                img1_path=temp_path, 
                img2_path=face_path
                )
            if result["verified"]:
                # Lấy thời gian hiện tại
                checkin_time = datetime.now()
                
                # Định nghĩa các mốc thời gian (có thể điều chỉnh)
                start_time = time(8, 0)  # 08:00 - Bắt đầu làm việc
                end_time = time(8, 15)  # 08:15 - Hết thời gian ân hạn

                if checkin_time.time() < start_time:
                    status_attendance = "early"  # Sớm
                elif start_time <= checkin_time.time() <= end_time:
                    status_attendance = "on_time"  # Đúng giờ
                else:
                    status_attendance = "late" # Muộn

                # Ghi nhận điểm danh
                attendance = await Attendance.create(
                    user=current_user,
                    date=checkin_time.date(),
                    time=checkin_time.time(),
                    status=status_attendance,
                )

                # Xóa ảnh tạm thời
                if os.path.exists(temp_path):
                    os.remove(temp_path)

                return {
                    "attendance_id": attendance.attendance_id,
                    "user_id": current_user.user_id,
                    "username": current_user.username,
                    "date": attendance.date,
                    "time": attendance.time,
                    "status": attendance.status,
                }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error verifying face image: {str(e)}"
            )
    except Exception as e:
        # Nếu có lỗi, xóa ảnh đã lưu
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error recording attendance: {str(e)}"
        )
    

@router.get("/history/me", response_model=List[dict])
async def get_my_attendance_history(
    current_user: User = Depends(get_current_user)
):
    """User xem lịch sử điểm danh cá nhân."""
    # Lấy lịch sử điểm danh của user
    attendances = await Attendance.filter(user_id=current_user.user_id).prefetch_related("user")
    return [
        {
            "attendance_id": attendance.attendance_id,
            "user_id": attendance.user.user_id,
            "username": attendance.user.username,
            "date": attendance.date,
            "time": attendance.time,
            "status": attendance.status,
        }
        for attendance in attendances
    ]


@router.get("/history/user/{user_id}", response_model=List[dict])
async def get_user_attendance_history(
    user_id: int,
    current_user: User = Depends(get_current_admin)
):
    """Admin xem lịch sử của user khác."""
    # Kiểm tra xem user_id có tồn tại trong hệ thống không
    user = await User.get_or_none(user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Lấy lịch sử điểm danh của user
    attendances = await Attendance.filter(user_id=user_id).prefetch_related("user")
    return [
        {
            "attendance_id": attendance.attendance_id,
            "user_id": attendance.user.user_id,
            "username": attendance.user.username,
            "date": attendance.date,
            "time": attendance.time,
            "status": attendance.status,
        }
        for attendance in attendances
    ]


@router.get("/history/date", response_model=List[dict])
async def get_all_attendance_history(
    date: str = None,
    current_admin: User = Depends(get_current_admin)
):
    """Admin xem lịch sử điểm danh theo ngày."""
    try:
        attendances = await Attendance.filter(date=date).prefetch_related("user")
        return [
            {
                "attendance_id": attendance.attendance_id,
                "user_id": attendance.user.user_id,
                "username": attendance.user.username,
                "date": attendance.date,
                "time": attendance.time,
                "status": attendance.status,
            }
            for attendance in attendances
        ]
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving attendance history: {str(e)}"
        )