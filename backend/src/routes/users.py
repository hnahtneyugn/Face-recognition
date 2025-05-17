from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Request
from src.utils.auth_utils import get_current_user
from src.utils.file_utils import save_face_image, remove_face_image
from src.utils.filter_utils import attendance_filters

from src.models import User, Attendance
from datetime import datetime, time
from deepface import DeepFace
from typing import List
import os
from PIL import Image


router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=dict)
async def get_my_info(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """User xem thông tin của cá nhân."""
    return {
        "user_id": current_user.user_id,
        "fullname": current_user.fullname,
        "email": current_user.email,
        "department": current_user.department,
        "face_path": f"/{current_user.face_path}"
    }


@router.post("/attendance")
async def record_attendance(
    face_image: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """User điểm danh với ảnh khuôn mặt."""
    temp_path = save_face_image(file=face_image, folder="temp")

    try:   
        # Đảm bảo sử dụng đường dẫn tuyệt đối cho DeepFace
        absolute_temp_path = os.path.abspath(temp_path)
        
        # Xử lý đường dẫn ảnh tham chiếu
        user_face_path = current_user.face_path.lstrip('/')  # Loại bỏ dấu / đầu nếu có
        absolute_face_path = os.path.abspath(user_face_path)
        
        # Kiểm tra sự tồn tại của cả hai tệp
        if not os.path.exists(absolute_temp_path):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Temporary face image not found at {absolute_temp_path}"
            )
            
        if not os.path.exists(absolute_face_path):
            alternative_path = os.path.join(os.getcwd(), user_face_path)
            if os.path.exists(alternative_path):
                absolute_face_path = alternative_path
            else:
                print(f"Failed to find face image at: {absolute_face_path}")
                print(f"Alternative path tried: {alternative_path}")
                print(f"Current directory: {os.getcwd()}")
                print(f"User face_path from DB: {current_user.face_path}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Không tìm thấy ảnh khuôn mặt tham chiếu của người dùng. Vui lòng cập nhật ảnh đại diện của bạn."
                )
            
        print(f"Verifying faces: temp={absolute_temp_path}, user={absolute_face_path}")
        
        # Kiểm tra xem ảnh có thể đọc được không
        try:
            Image.open(absolute_temp_path).verify()
            Image.open(absolute_face_path).verify()
        except Exception as img_error:
            print(f"Error verifying image files: {str(img_error)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Không thể đọc một hoặc cả hai ảnh khuôn mặt. Vui lòng thử lại hoặc cập nhật ảnh đại diện của bạn."
            )
        
        # Thực hiện xác minh khuôn mặt
        try:
            result = DeepFace.verify(img1_path=absolute_temp_path, img2_path=absolute_face_path)
            if not result["verified"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Xác minh khuôn mặt không thành công."
                )
        except ValueError as ve:
            error_message = str(ve)
            if "img1_path" in error_message:
                detail = "Không phát hiện khuôn mặt trong ảnh đã cung cấp. Vui lòng chụp lại ảnh khác với khuôn mặt của bạn được nhìn thấy rõ ràng."
            elif "img2_path" in error_message:
                detail = "Không phát hiện khuôn mặt trong ảnh đại diện của bạn. Vui lòng cập nhật ảnh đại diện với hình ảnh khuôn mặt rõ ràng."
            else:
                detail = error_message
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=detail
            )
        
        # Ghi nhận điểm danh
        checkin_date = datetime.now().date()
        checkin_time = datetime.now().time()
        attendance_time = time(8, 0)

        attendance = await Attendance.get_or_none(user=current_user, date=checkin_date)
        
        if not attendance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy bản ghi điểm danh cho hôm nay."
            )

        if attendance.time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bạn đã điểm danh hôm nay rồi."
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
    
    except HTTPException as he:
        raise he
    except Exception as e:
        error_message = str(e)
        print(f"Error during attendance processing: {error_message}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing attendance: {error_message}"
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
