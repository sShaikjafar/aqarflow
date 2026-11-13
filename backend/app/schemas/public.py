import re
import uuid
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_RE = re.compile(r"^[0-9+()\-\s]{7,20}$")


class PublicMedia(BaseModel):
    id: uuid.UUID
    url: str
    caption: Optional[str] = None
    is_cover: bool


class PublicProperty(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    reference_code: str
    title: str
    description: Optional[str] = None
    purpose: str
    property_type: str
    price: float
    currency: str
    area_value: Optional[float] = None
    area_unit: str
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    city: str
    locality: Optional[str] = None
    status: str
    cover_url: Optional[str] = None
    media: list[PublicMedia] = Field(default_factory=list)


class PublicPropertyList(BaseModel):
    items: list[PublicProperty]
    total: int
    page: int
    page_size: int


class InquiryCreate(BaseModel):
    property_id: Optional[uuid.UUID] = None
    name: str = Field(min_length=2, max_length=200)
    phone: Optional[str] = Field(default=None, max_length=30)
    email: Optional[str] = Field(default=None, max_length=255)
    message: Optional[str] = Field(default=None, max_length=2000)
    preferred_contact: Literal["phone", "email", "whatsapp"] = "phone"
    website: Optional[str] = None  # honeypot field, real visitors leave it empty

    @field_validator("name")
    @classmethod
    def clean_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Name must be at least 2 characters")
        return v

    @field_validator("phone", "email", "message", mode="before")
    @classmethod
    def empty_to_none(cls, v):
        if isinstance(v, str):
            v = v.strip()
            return v or None
        return v

    @field_validator("phone")
    @classmethod
    def check_phone(cls, v):
        if v is not None and not PHONE_RE.match(v):
            raise ValueError("Enter a valid phone number")
        return v

    @field_validator("email")
    @classmethod
    def check_email(cls, v):
        if v is not None:
            v = v.lower()
            if not EMAIL_RE.match(v):
                raise ValueError("Enter a valid email address")
        return v

    @model_validator(mode="after")
    def need_contact(self):
        if not self.phone and not self.email:
            raise ValueError("Please provide a phone number or an email address")
        return self


class InquiryResponse(BaseModel):
    message: str
