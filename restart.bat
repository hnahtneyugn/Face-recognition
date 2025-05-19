@echo off
echo Stopping containers...
docker-compose down

echo Rebuilding containers...
docker-compose build

echo Starting containers...
docker-compose up -d

echo Containers restarted successfully!
echo Frontend available at: http://localhost:3001
echo Backend available at: http://localhost:8000
pause 