from fastapi import FastAPI
from tortoise import Tortoise
from backend.database import init_db, init_orm

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    # await init_db()
    pass    # only need to run 1 time to set up a Neon Postgres Database

@app.on_event("shutdown")
async def shutdown_event():
    await Tortoise.close_connections()

init_orm(app=app)
