from tortoise.models import Model
from tortoise import fields

class Employee(Model):
    employee_id = fields.IntField(pk=True, generated=True)
    fullname = fields.CharField(max_length=255)
    department = fields.CharField(max_length=255)
    email = fields.CharField(max_length=255, unique=True)
    phone_number = fields.CharField(max_length=20, unique=True)
    face_path = fields.CharField(max_length=255)

    class Meta:
        table = "employees"


class User(Model):
    user_id = fields.IntField(pk=True, generated=True)
    employee = fields.ForeignKeyField("models.Employee", related_name="users", on_delete=fields.CASCADE)
    username = fields.CharField(max_length=50, unique=True)
    password_hash = fields.CharField(max_length=255)
    role = fields.CharField(max_length=20, default="user")

    class Meta:
        table = "users"


class Attendance(Model):
    attendance_id = fields.IntField(pk=True, generated=True)
    user = fields.ForeignKeyField("models.User", related_name="attendances", on_delete=fields.CASCADE)
    date = fields.DateField()
    time = fields.TimeField()
    status = fields.CharField(max_length=20)

    class Meta:
        table = "attendances"
