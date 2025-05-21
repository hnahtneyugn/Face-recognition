from datetime import datetime
from src.models import Attendance, User
from datetime import datetime


async def initialize_attendance():
    """Tự động tạo bản ghi Attendance cho tất cả người dùng vào mỗi ngày mới."""
    try:
        today = datetime.now().date()

        # if today.weekday() in (5, 6):
        #     print(f"Skipping attendance initialization on {today} (weekend)")
        #     return

        existing = await Attendance.filter(date=today).exists()
        if existing:
            print(f"Attendance records already exist for {today}, skipping creation")
            return
        
        users = await User.filter(role="user").all()
        if not users:
            print(f"No users found for attendance on {today}")
            return
        
        created_attendance = [Attendance(user=user, date=today, status="pending") for user in users]
        await Attendance.bulk_create(created_attendance)
        print(f"Attendance records initialized for {len(users)} users on {today}")

    except Exception as e:
        print(f"Error initializing attendance: {e}")