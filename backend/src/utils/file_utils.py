from fastapi import HTTPException, status, UploadFile
from datetime import datetime
import os
import shutil


def save_face_image(file: UploadFile, folder: str) -> str:
    """Lưu ảnh khuôn mặt vào thư mục chỉ định, trả về đường dẫn ảnh."""
    os.makedirs(folder, exist_ok=True)

    timestamp = int(datetime.now().timestamp())
    try:
        # Nếu không có tên file hoặc không có extension, sử dụng .jpg
        if not file.filename or '.' not in file.filename:
            print(f"Invalid filename: {file.filename}, using default extension")
            file_extension = "jpg"
        else:
            file_extension = file.filename.split(".")[-1]
            
        file_name = f"{timestamp}.{file_extension}"
        relative_path = f"{folder}/{file_name}"
        absolute_path = os.path.abspath(os.path.join(folder, file_name))
        
        print(f"Saving file to: {absolute_path}")
        print(f"Content type: {file.content_type}, Size: {file.size}")

        with open(absolute_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        print(f"File saved successfully at {absolute_path}")
        
        # Reset file position for potential reuse
        file.file.seek(0)
        
        return relative_path
    except Exception as e:
        print(f"Error saving face image: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving face image: {e}"
        )


def remove_face_image(path: str):
    """Xóa file nếu tồn tại."""
    try:
        # Try with the path as-is
        if os.path.exists(path):
            os.remove(path)
            print(f"Successfully removed file: {path}")
            return
            
        # Try with the absolute path
        abs_path = os.path.abspath(path)
        if os.path.exists(abs_path):
            os.remove(abs_path)
            print(f"Successfully removed file: {abs_path}")
            return
            
        # Try with the path relative to current working directory
        cwd_path = os.path.join(os.getcwd(), path)
        if os.path.exists(cwd_path):
            os.remove(cwd_path)
            print(f"Successfully removed file: {cwd_path}")
            return
            
        print(f"Warning: Could not find file to remove at {path}")
    except Exception as e:
        print(f"Error removing file {path}: {str(e)}")

