FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get upgrade -y

RUN apt-get install -y libgl1-mesa-glx libglib2.0-0 libsm6 libxrender1 libxext6 curl

COPY requirements.txt ./

RUN pip install --no-cache-dir -r requirements.txt

COPY src ./src

# Tạo thư mục faces với quyền đầy đủ và đảm bảo có quyền đọc ghi
RUN mkdir -p /app/faces && chmod -R 777 /app/faces

EXPOSE 8000

# Script khởi động kiểm tra thư mục faces
RUN echo '#!/bin/bash' > /app/start.sh && \
    echo 'echo "Kiểm tra thư mục faces trong volume:"' >> /app/start.sh && \
    echo 'ls -la /app/faces' >> /app/start.sh && \
    echo 'if [ ! -d "/app/faces" ] || [ -z "$(ls -A /app/faces)" ]; then' >> /app/start.sh && \
    echo '  echo "Thư mục faces trống hoặc không tồn tại - kiểm tra volume mount!"' >> /app/start.sh && \
    echo 'fi' >> /app/start.sh && \
    echo 'echo "Bắt đầu ứng dụng..."' >> /app/start.sh && \
    echo 'exec uvicorn src.main:app --host 0.0.0.0 --port 8000' >> /app/start.sh && \
    chmod +x /app/start.sh

CMD ["/app/start.sh"] 