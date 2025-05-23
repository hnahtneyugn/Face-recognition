@echo off
REM Build the backend Docker image from the root directory
docker build -t eddyandwhale/face-recognition-backend-mac:latest -f backend/Dockerfile . 