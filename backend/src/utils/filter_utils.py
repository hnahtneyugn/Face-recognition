from fastapi import HTTPException, status
from src.models import User


async def get_user_by_id(user_id: int) -> User:
    """Lấy thông tin người dùng theo ID."""
    user = await User.get_or_none(user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


def attendance_filters(
    att,
    year: int = None,
    month: int = None,
    day: int = None,
    status: str = None
) -> bool:
    return (
        (not year or att.date.year == year) and
        (not month or att.date.month == month) and
        (not day or att.date.day == day) and
        (not status or att.status == status)
    )


def user_filters(
    fullname: str = None,
    email: str = None,
    department: str = None,
    role: str = None
) -> dict:
    """Tạo dict filter cho truy vấn User."""
    filters = {}
    if fullname:
        filters["fullname__icontains"] = fullname
    if email:
        filters["email__icontains"] = email
    if department:
        filters["department__icontains"] = department
    if role:
        filters["role__iexact"] = role
    return filters

