FROM --platform=linux/amd64 python:3.11-slim

WORKDIR /app

COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install fastapi[all] \
    && pip install tortoise-orm \
    && pip install tortoise-orm[asyncpg] \
    && pip install python-jose[cryptography] \
    && pip install passlib[bcrypt] \
    && pip install deepface \
    && pip install aerich \
    && pip install tomli \
    && pip install tomlkit






