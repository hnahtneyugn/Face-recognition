from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from src.database import init_db, init_orm
from src.routes import auth, admins, users
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from src.utils.attendance_utils import initialize_attendance
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Request
import os

app = FastAPI()
init_orm(app)


app.include_router(auth.router)
app.include_router(admins.router)
app.include_router(users.router)

# Ensure the faces directory exists
os.makedirs("faces", exist_ok=True)
app.mount("/faces", StaticFiles(directory="faces"), name="faces")

scheduler = AsyncIOScheduler()


scheduler.add_job(initialize_attendance, "cron", hour=21, minute=54)


@app.on_event("startup")
async def startup_event():
    await init_db()
    await initialize_attendance()
    scheduler.start()
    print("Scheduler started")
    print(f"Static files directory: {os.path.abspath('faces')}")


@app.on_event("shutdown")
async def shutdown_event():
    scheduler.shutdown()
    print("Scheduler shutdown")


# Adding CORS middleware to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://127.0.0.1:3001", "http://frontend:3001"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)