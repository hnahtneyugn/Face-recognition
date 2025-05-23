@echo off
REM Script để copy các files từ thư mục faces vào container sau khi build

REM Tìm và lấy ID của container backend đang chạy
FOR /F "tokens=*" %%i IN ('docker ps -qf "name=backend"') DO SET CONTAINER_ID=%%i

IF "%CONTAINER_ID%"=="" (
  echo Không tìm thấy container backend đang chạy
  exit /b 1
)

REM Copy tất cả files từ thư mục faces vào container
echo Đang sao chép files từ .\faces vào container %CONTAINER_ID%:/app/faces
docker cp .\faces\. %CONTAINER_ID%:/app/faces/

echo Hoàn tất sao chép! 