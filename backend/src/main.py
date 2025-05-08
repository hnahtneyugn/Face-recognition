from fastapi import FastAPI
from src.database import init_orm
from src.routes import attendance, auth, employees, users


app = FastAPI()


app.include_router(attendance.router)
app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(users.router)

init_orm(app)