from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from src.database import init_db, init_orm
from src.routes import auth, admins, users
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from src.utils.attendance_utils import initialize_attendance
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Request

app = FastAPI()
init_orm(app)


app.include_router(auth.router)
app.include_router(admins.router)
app.include_router(users.router)
app.mount("/faces", StaticFiles(directory="faces"), name="faces")

scheduler = AsyncIOScheduler()


scheduler.add_job(initialize_attendance, "cron", hour=14, minute=58)


@app.on_event("startup")
async def startup_event():
    await init_db()
    scheduler.start()
    print("Scheduler started")


@app.on_event("shutdown")
async def shutdown_event():
    scheduler.shutdown()
    print("Scheduler shutdown")


# Adding CORS middleware to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://127.0.0.1:3001"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)