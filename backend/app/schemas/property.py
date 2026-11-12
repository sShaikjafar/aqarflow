import uuid
from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

Purpose = Literal["sale", "rent"]
PropertyType = Literal[
    "apartment", "house", "villa", "plot", "commercial", "office"
]
PropertyStatus = Literal[
    "draft", "available", "reserved", "sold", "rented", "inactive"
]
AreaUnit = Literal["sqft", "sqm", "sqyd", "acre"]


class PropertyCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: Optional[str] = None
    purpose: Purpose
    property_type: PropertyType
    price: Decimal = Field(gt=0, max_digits=14, decimal_places=2)
    currency: str = Field(default="INR", min_length=3, max_length=3)
    area_value: Optional[Decimal] = Field(default=None, gt=0)
    area_unit: AreaUnit = "sqft"
    bedrooms: Optional[int] = Field(default=None, ge=0, le=50)
    bathrooms: Optional[int] = Field(default=None, ge=0, le=50)
    address: Optional[str] = Field(default=None, max_length=300)
    city: str = Field(min_length=2, max_length=100)
    locality: Optional[str] = Field(default=None, max_length=100)
    status: PropertyStatus = "draft"
    is_published: bool = False
    assigned_agent_id: Optional[uuid.UUID] = None


class PropertyUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=200)
    description: Optional[str] = None
    purpose: Optional[Purpose] = None
    property_type: Optional[PropertyType] = None
    price: Optional[Decimal] = Field(
        default=None, gt=0, max_digits=14, decimal_places=2
    )
    currency: Optional[str] = Field(default=None, min_length=3, max_length=3)
    area_value: Optional[Decimal] = Field(default=None, gt=0)
    area_unit: Optional[AreaUnit] = None
    bedrooms: Optional[int] = Field(default=None, ge=0, le=50)
    bathrooms: Optional[int] = Field(default=None, ge=0, le=50)
    address: Optional[str] = Field(default=None, max_length=300)
    city: Optional[str] = Field(default=None, min_length=2, max_length=100)
    locality: Optional[str] = Field(default=None, max_length=100)
    status: Optional[PropertyStatus] = None
    is_published: Optional[bool] = None
    assigned_agent_id: Optional[uuid.UUID] = None


class PropertyMediaOut(BaseModel):
    id: uuid.UUID
    url: str
    caption: Optional[str] = None
    sort_order: int
    is_cover: bool


class PropertyOut(BaseModel):
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
    address: Optional[str] = None
    city: str
    locality: Optional[str] = None
    status: str
    is_published: bool
    assigned_agent_id: Optional[uuid.UUID] = None
    cover_url: Optional[str] = None
    media: list[PropertyMediaOut] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class PropertyList(BaseModel):
    items: list[PropertyOut]
    total: int
    page: int
    page_size: int
