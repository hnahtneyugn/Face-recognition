from tortoise.models import Model
from tortoise import fields


class User(Model):
    user_id = fields.IntField(pk=True, generated=True)
    username = fields.CharField(max_length=50, unique=True)
    password_hash = fields.CharField(max_length=255)
    role = fields.CharField(max_length=20, default="user")
    fullname = fields.CharField(max_length=255)
    email = fields.CharField(max_length=255, unique=True)
    department = fields.CharField(max_length=255)
    face_path = fields.CharField(max_length=255, unique=True)

    class Meta:
        table = "users"


class Attendance(Model):
    attendance_id = fields.IntField(pk=True, generated=True)
    user = fields.ForeignKeyField("models.User", related_name="attendances", on_delete=fields.CASCADE)
    date = fields.DateField()
    time = fields.DatetimeField(null=True)
    status = fields.CharField(max_length=20, default="pending")

    class Meta:
        table = "attendances"
