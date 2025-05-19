FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get upgrade -y

RUN apt-get install -y libgl1-mesa-glx libglib2.0-0 libsm6 libxrender1 libxext6 curl

COPY requirements.txt ./

RUN pip install --no-cache-dir -r requirements.txt

COPY src ./src

# Tạo thư mục faces với quyền đầy đủ
RUN mkdir -p /app/faces && chmod 777 /app/faces

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"] 