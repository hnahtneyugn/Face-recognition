from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from src.utils.auth_utils import get_current_user
from src.utils.file_utils import save_face_image, remove_face_image
from src.utils.filter_utils import attendance_filters

from src.models import User, Attendance
from datetime import datetime, time, timezone
from deepface import DeepFace
from typing import List


router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=dict)
async def get_my_info(current_user: User = Depends(get_current_user)):
    """User xem thông tin của cá nhân."""
    return {
        "user_id": current_user.user_id,
        "fullname": current_user.fullname,
        "email": current_user.email,
        "department": current_user.department,
        "face_path": current_user.face_path
    }


@router.post("/attendance")
async def record_attendance(
    face_image: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """User điểm danh với ảnh khuôn mặt."""
    temp_path = save_face_image(file=face_image, folder="temp")

    try:   
        result = DeepFace.verify(img1_path=temp_path, img2_path=current_user.face_path)

        if not result["verified"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Face verification failed"
            )
        checkin_date = datetime.now().date()
        checkin_time = datetime.now().time()
        attendance_time = time(8, 0)

        attendance = await Attendance.get_or_none(user=current_user, date=checkin_date)
        
        if not attendance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attendance record not found for today"
            )

        if attendance.time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Attendance already recorded for today"
            )
        
        attendance.time = checkin_time
        attendance.status = "on_time" if checkin_time <= attendance_time else "late"
        await attendance.save()

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
            detail=f"Error processing attendance: {str(e)}"
        )
    finally:
        remove_face_image(temp_path)
    

@router.get("/attendance", response_model=List[dict])
async def get_attendance_history(
    year: int = None,
    month: int = None,
    day: int = None,
    status: str = None,
    current_user: User = Depends(get_current_user)
):
    """User xem lịch sử điểm danh."""
    attendances = await Attendance.filter(user=current_user).order_by("-date")
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


@router.post("/attendance/confirm")
async def confirm_attendance(
    data: dict,
    current_user: User = Depends(get_current_user)
):
    """Xác nhận điểm danh cho user."""
    try:
        # Kiểm tra xem đã điểm danh hôm nay chưa
        today = datetime.now().date()
        existing_attendance = await Attendance.filter(
            user=current_user,
            date=today
        ).first()

        if existing_attendance:
            if existing_attendance.status != "pending":
                raise HTTPException(
                    status_code=400,
                    detail="Bạn đã điểm danh hôm nay"
                )
            # Cập nhật trạng thái điểm danh
            existing_attendance.status = "on_time"
            existing_attendance.time = datetime.now().time()
            await existing_attendance.save()
        else:
            # Tạo bản ghi điểm danh mới
            await Attendance.create(
                user=current_user,
                date=today,
                time=datetime.now().time(),
                status="on_time"
            )

        return {"message": "Điểm danh thành công"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
