from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from .farm import FarmType



class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None


class User(UserBase):
    id: int
    is_active: bool = True
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserResponse(User):
    pass


class UserBookConsultation(BaseModel):
    fullname: str
    phonenumber: str
    email:EmailStr
    farm_type: FarmType
    message: str



    class Config:
        from_attributes = True