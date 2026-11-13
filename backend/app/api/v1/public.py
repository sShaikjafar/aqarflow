import uuid
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.api.v1.properties import media_url
from app.core.config import settings
from app.core.database import get_db
from app.models.agency import Agency
from app.models.lead import Contact, Lead
from app.models.property import Property, PropertyMedia
from app.schemas.property import PropertyType, Purpose
from app.schemas.public import (
    InquiryCreate,
    InquiryResponse,
    PublicMedia,
    PublicProperty,
    PublicPropertyList,
)

router = APIRouter(prefix="/public", tags=["public"])

VISIBLE_STATUSES = ("available", "reserved")


def get_agency(db: Session) -> Agency:
    agency = db.scalar(
        select(Agency).where(
            Agency.slug == settings.PUBLIC_AGENCY_SLUG, Agency.status == "active"
        )
    )
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")
    return agency


def visible(agency_id):
    return (
        Property.agency_id == agency_id,
        Property.is_published.is_(True),
        Property.status.in_(VISIBLE_STATUSES),
    )


def to_public(prop: Property, media: list[PropertyMedia]) -> PublicProperty:
    out = PublicProperty.model_validate(prop)
    out.media = [
        PublicMedia(
            id=m.id,
            url=media_url(m.storage_key),
            caption=m.caption,
            is_cover=m.is_cover,
        )
        for m in media
    ]
    cover = next((m for m in media if m.is_cover), media[0] if media else None)
    out.cover_url = media_url(cover.storage_key) if cover else None
    return out


@router.get("/properties", response_model=PublicPropertyList)
def public_list(
    q: Optional[str] = None,
    purpose: Optional[Purpose] = None,
    property_type: Optional[PropertyType] = None,
    city: Optional[str] = None,
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    bedrooms: Optional[int] = Query(None, ge=0),
    sort: Literal["newest", "price_asc", "price_desc"] = "newest",
    page: int = Query(1, ge=1),
    page_size: int = Query(9, ge=1, le=30),
    db: Session = Depends(get_db),
):
    agency = get_agency(db)
    stmt = select(Property).where(*visible(agency.id))
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(
                Property.title.ilike(like),
                Property.city.ilike(like),
                Property.locality.ilike(like),
            )
        )
    if purpose:
        stmt = stmt.where(Property.purpose == purpose)
    if property_type:
        stmt = stmt.where(Property.property_type == property_type)
    if city:
        stmt = stmt.where(Property.city.ilike(f"%{city.strip()}%"))
    if min_price is not None:
        stmt = stmt.where(Property.price >= min_price)
    if max_price is not None:
        stmt = stmt.where(Property.price <= max_price)
    if bedrooms is not None:
        stmt = stmt.where(Property.bedrooms >= bedrooms)

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    order = {
        "newest": Property.created_at.desc(),
        "price_asc": Property.price.asc(),
        "price_desc": Property.price.desc(),
    }[sort]
    rows = db.scalars(
        stmt.order_by(order).offset((page - 1) * page_size).limit(page_size)
    ).all()

    covers: dict = {}
    if rows:
        media_rows = db.scalars(
            select(PropertyMedia)
            .where(PropertyMedia.property_id.in_([r.id for r in rows]))
            .order_by(
                PropertyMedia.is_cover.desc(),
                PropertyMedia.sort_order,
                PropertyMedia.created_at,
            )
        )
        for m in media_rows:
            covers.setdefault(m.property_id, m)

    items = [to_public(r, [covers[r.id]] if r.id in covers else []) for r in rows]
    return PublicPropertyList(items=items, total=total, page=page, page_size=page_size)


@router.get("/cities", response_model=list[str])
def public_cities(db: Session = Depends(get_db)):
    agency = get_agency(db)
    rows = db.scalars(
        select(Property.city).where(*visible(agency.id)).distinct().order_by(Property.city)
    ).all()
    return list(rows)


@router.get("/properties/{property_id}", response_model=PublicProperty)
def public_detail(property_id: uuid.UUID, db: Session = Depends(get_db)):
    agency = get_agency(db)
    prop = db.scalar(
        select(Property).where(Property.id == property_id, *visible(agency.id))
    )
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    media = db.scalars(
        select(PropertyMedia)
        .where(PropertyMedia.property_id == prop.id)
        .order_by(PropertyMedia.sort_order, PropertyMedia.created_at)
    ).all()
    return to_public(prop, list(media))


@router.post("/inquiries", response_model=InquiryResponse, status_code=201)
def create_inquiry(data: InquiryCreate, db: Session = Depends(get_db)):
    thanks = InquiryResponse(
        message="Thank you! Our team will contact you shortly."
    )
    # Honeypot: bots fill hidden fields. Pretend success, save nothing.
    if data.website:
        return thanks

    agency = get_agency(db)

    property_id = None
    if data.property_id:
        prop = db.scalar(
            select(Property).where(
                Property.id == data.property_id, *visible(agency.id)
            )
        )
        if not prop:
            raise HTTPException(status_code=404, detail="Property not found")
        property_id = prop.id

    contact = None
    if data.email:
        contact = db.scalar(
            select(Contact).where(
                Contact.agency_id == agency.id, Contact.email == data.email
            )
        )
    if contact is None and data.phone:
        contact = db.scalar(
            select(Contact).where(
                Contact.agency_id == agency.id, Contact.phone == data.phone
            )
        )
    if contact is None:
        contact = Contact(
            agency_id=agency.id,
            name=data.name,
            phone=data.phone,
            email=data.email,
        )
        db.add(contact)
        db.flush()

    db.add(
        Lead(
            agency_id=agency.id,
            contact_id=contact.id,
            property_id=property_id,
            source="website",
            message=data.message,
            preferred_contact=data.preferred_contact,
            stage="new",
        )
    )
    db.commit()
    return thanks
