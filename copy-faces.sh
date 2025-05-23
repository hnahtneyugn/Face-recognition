#!/bin/bash
# Script để copy các files từ thư mục faces vào container sau khi build

# Tìm và lấy ID của container backend đang chạy
CONTAINER_ID=$(docker ps -qf "name=backend")

if [ -z "$CONTAINER_ID" ]; then
  echo "Không tìm thấy container backend đang chạy"
  exit 1
fi

# Copy tất cả files từ thư mục faces vào container
echo "Đang sao chép files từ ./faces vào container $CONTAINER_ID:/app/faces"
docker cp ./faces/. $CONTAINER_ID:/app/faces/

echo "Hoàn tất sao chép!" 