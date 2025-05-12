from fastapi import HTTPException, status, UploadFile
from datetime import datetime
import os
import shutil
import logging
import base64
from pathlib import Path

# Cấu hình logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Đường dẫn thư mục faces
INDEPENDENT_FACES_DIR = "../faces"  # Thư mục faces độc lập
FRONTEND_FACES_DIR = "../frontend/public/faces"  # Thư mục faces trong frontend

def ensure_directories():
    """Đảm bảo các thư mục faces tồn tại."""
    os.makedirs(INDEPENDENT_FACES_DIR, exist_ok=True)
    os.makedirs(FRONTEND_FACES_DIR, exist_ok=True)

def sync_image_to_frontend(source_path: str):
    """Đồng bộ ảnh từ thư mục faces độc lập sang frontend."""
    try:
        file_name = os.path.basename(source_path)
        target_path = os.path.join(FRONTEND_FACES_DIR, file_name)
        shutil.copy2(source_path, target_path)
        logger.info(f"Synced image to frontend: {target_path}")
    except Exception as e:
        logger.error(f"Error syncing image to frontend: {str(e)}", exc_info=True)

def save_base64_image(base64_string: str, file_name: str, folder: str) -> str:
    """Lưu ảnh từ chuỗi base64 vào thư mục faces độc lập, trả về đường dẫn ảnh."""
    logger.info(f"Starting to save base64 image. File info: filename={file_name}")
    
    ensure_directories()
    logger.info(f"Ensured directories exist")

    timestamp = int(datetime.now().timestamp())
    file_extension = file_name.split(".")[-1]
    new_file_name = f"{timestamp}.{file_extension}"
    path = os.path.join(INDEPENDENT_FACES_DIR, new_file_name)
    logger.info(f"Generated file path: {path}")

    try:
        # Giải mã base64
        image_data = base64.b64decode(base64_string)
        logger.info(f"Decoded base64 string, size: {len(image_data)} bytes")
        
        # Lưu file
        with open(path, "wb") as buffer:
            buffer.write(image_data)
        logger.info(f"Successfully saved file to {path}")
        
        # Đồng bộ sang frontend
        sync_image_to_frontend(path)
        
        # Kiểm tra file sau khi lưu
        if os.path.exists(path):
            file_size = os.path.getsize(path)
            logger.info(f"File exists after saving, size: {file_size} bytes")
        else:
            logger.error("File does not exist after saving!")
            
    except Exception as e:
        logger.error(f"Error saving base64 image: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving image: {str(e)}"
        )
    return path

def save_face_image(file: UploadFile, folder: str) -> str:
    """Lưu ảnh khuôn mặt vào thư mục faces độc lập, trả về đường dẫn ảnh."""
    logger.info(f"Starting to save face image. File info: filename={file.filename}, content_type={file.content_type}")
    
    ensure_directories()
    logger.info(f"Ensured directories exist")

    timestamp = int(datetime.now().timestamp())
    file_extension = file.filename.split(".")[-1]
    file_name = f"{timestamp}.{file_extension}"
    path = os.path.join(INDEPENDENT_FACES_DIR, file_name)
    logger.info(f"Generated file path: {path}")

    try:
        # Đọc nội dung file
        contents = file.file.read()
        logger.info(f"Read file contents, size: {len(contents)} bytes")
        
        # Reset file pointer
        file.file.seek(0)
        
        with open(path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        logger.info(f"Successfully saved file to {path}")
        
        # Đồng bộ sang frontend
        sync_image_to_frontend(path)
        
        # Kiểm tra file sau khi lưu
        if os.path.exists(path):
            file_size = os.path.getsize(path)
            logger.info(f"File exists after saving, size: {file_size} bytes")
        else:
            logger.error("File does not exist after saving!")
            
    except Exception as e:
        logger.error(f"Error saving face image: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving face image: {str(e)}"
        )
    return path

def remove_face_image(path: str):
    """Xóa file nếu tồn tại ở cả thư mục faces độc lập và frontend."""
    logger.info(f"Attempting to remove file: {path}")
    
    # Xóa file ở thư mục faces độc lập
    if os.path.exists(path):
        try:
            os.remove(path)
            logger.info(f"Successfully removed independent faces file: {path}")
        except Exception as e:
            logger.error(f"Error removing independent faces file: {str(e)}", exc_info=True)
    else:
        logger.warning(f"Independent faces file does not exist, cannot remove: {path}")
    
    # Xóa file ở frontend
    file_name = os.path.basename(path)
    frontend_path = os.path.join(FRONTEND_FACES_DIR, file_name)
    if os.path.exists(frontend_path):
        try:
            os.remove(frontend_path)
            logger.info(f"Successfully removed frontend file: {frontend_path}")
        except Exception as e:
            logger.error(f"Error removing frontend file: {str(e)}", exc_info=True)
    else:
        logger.warning(f"Frontend file does not exist, cannot remove: {frontend_path}")

