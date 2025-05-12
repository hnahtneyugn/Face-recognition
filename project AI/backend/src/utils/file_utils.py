from fastapi import HTTPException, status, UploadFile
from datetime import datetime
import os
import shutil


def save_face_image(file: UploadFile, folder: str) -> str:
    """Lưu ảnh khuôn mặt vào thư mục chỉ định, trả về đường dẫn ảnh."""
    os.makedirs(folder, exist_ok=True)

    timestamp = int(datetime.now().timestamp())
    file_extension = file.filename.split(".")[-1]
    file_name = f"{timestamp}.{file_extension}"
    path = os.path.join(folder, file_name)

    try:
        with open(path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving face image: {e}"
        )
    return path


def remove_face_image(path: str):
    """Xóa file nếu tồn tại."""
    if os.path.exists(path):
        os.remove(path)

