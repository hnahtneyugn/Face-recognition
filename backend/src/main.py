from fastapi import FastAPI
from src.database import init_db, init_orm
from src.routes import auth, admins, users
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from src.utils.attendance_utils import initialize_attendance


app = FastAPI()
init_orm(app)


app.include_router(auth.router)
app.include_router(admins.router)
app.include_router(users.router)


scheduler = AsyncIOScheduler()


scheduler.add_job(initialize_attendance, "cron", hour=21, minute=54)


@app.on_event("startup")
async def startup_event():
    await init_db()
    scheduler.start()
    print("Scheduler started")


@app.on_event("shutdown")
async def shutdown_event():
    scheduler.shutdown()
    print("Scheduler shutdown")