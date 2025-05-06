from tortoise import Tortoise
from tortoise.contrib.fastapi import register_tortoise
from fastapi import FastAPI
from dotenv import load_dotenv
import os

load_dotenv()

DB_URL = os.getenv("DATABASE_URL")

async def init_db():
    await Tortoise.init(
        db_url=DB_URL,
        modules={"models": ["backend.models", "aerich.models"]}
    )
    await Tortoise.generate_schemas()

TORTOISE_ORM = {
    "connections": {"default": DB_URL},
    "apps": {
        "models": {
            "models": ["backend.models", "aerich.models"],
            "default_connection": "default", 
        }
    }
}

def init_orm(app: FastAPI):
    register_tortoise(
        app,
        config=TORTOISE_ORM,
        generate_schemas=False,
        add_exception_handlers=True,
    )