from fastapi import HTTPException, status, UploadFile
from datetime import datetime
import os
import shutil


def save_face_image(file: UploadFile, folder: str) -> str:
    """Lưu ảnh khuôn mặt vào thư mục chỉ định, trả về đường dẫn ảnh."""
    # Đảm bảo thư mục tồn tại
    os.makedirs(folder, exist_ok=True)

    timestamp = int(datetime.now().timestamp())
    try:
        # Nếu không có tên file hoặc không có extension, sử dụng .jpg
        if not file.filename or '.' not in file.filename:
            print(f"Invalid filename: {file.filename}, using default extension")
            file_extension = "jpg"
        else:
            file_extension = file.filename.split(".")[-1].lower()
            
        file_name = f"{timestamp}.{file_extension}"
        relative_path = f"{folder}/{file_name}"
        absolute_path = os.path.abspath(os.path.join(folder, file_name))
        
        print(f"Saving file to: {absolute_path}")
        print(f"Content type: {file.content_type}, Size: {file.size}")

        # Kiểm tra quyền ghi vào thư mục
        if not os.access(os.path.dirname(absolute_path), os.W_OK):
            print(f"Warning: No write permission to {os.path.dirname(absolute_path)}")
            # Thử tạo file để kiểm tra quyền
            try:
                with open(os.path.join(os.path.dirname(absolute_path), "test_permission.txt"), "w") as f:
                    f.write("test")
                os.remove(os.path.join(os.path.dirname(absolute_path), "test_permission.txt"))
                print("Write permission test passed")
            except Exception as e:
                print(f"Write permission test failed: {str(e)}")
                raise
        
        # Sử dụng phương thức đọc/ghi file tiêu chuẩn
        with open(absolute_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        print(f"File saved successfully at {absolute_path}")
        
        # Reset file position for potential reuse
        file.file.seek(0)
        
        # Kiểm tra file đã được tạo thành công
        if os.path.exists(absolute_path) and os.path.getsize(absolute_path) > 0:
            print(f"File verified: exists and size is {os.path.getsize(absolute_path)} bytes")
        else:
            raise Exception(f"File verification failed: exists={os.path.exists(absolute_path)}, size={os.path.getsize(absolute_path) if os.path.exists(absolute_path) else 'N/A'}")
        
        return relative_path
    except Exception as e:
        print(f"Error saving face image: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving face image: {str(e)}"
        )


def remove_face_image(path: str):
    """Xóa file nếu tồn tại."""
    if not path:
        print("No path provided, skipping file removal")
        return
    
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

