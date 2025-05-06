from tortoise.models import Model
from tortoise import fields

class User(Model):
    user_id = fields.IntField(primary_key=True, auto_increment=True)
    username = fields.CharField(max_length=255, unique=True)
    hashed_password = fields.CharField(max_length=255)

    class Meta:
        table = 'users'