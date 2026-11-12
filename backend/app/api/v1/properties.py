import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.core.database import get_db
from app.core.storage import UPLOAD_DIR
from app.models.property import Property, PropertyMedia
from app.models.user import User
from app.schemas.property import (
    PropertyCreate,
    PropertyList,
    PropertyMediaOut,
    PropertyOut,
    PropertyType,
    PropertyStatus,
    PropertyUpdate,
    Purpose,
)

router = APIRouter(prefix="/properties", tags=["properties"])

ALLOWED_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
MAX_BYTES = 5 * 1024 * 1024
MAX_IMAGES = 10
NOT_NULL = {
    "title", "purpose", "property_type", "price", "city",
    "currency", "area_unit", "status", "is_published",
}


def media_url(key: str) -> str:
    return f"/media/{key}"


def looks_like_image(data: bytes) -> bool:
    return (
        data.startswith(b"\xff\xd8")
        or data.startswith(b"\x89PNG")
        or (data[:4] == b"RIFF" and data[8:12] == b"WEBP")
    )


def get_scoped(db: Session, user: User, property_id: uuid.UUID) -> Property:
    prop = db.scalar(
        select(Property).where(
            Property.id == property_id, Property.agency_id == user.agency_id
        )
    )
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return prop


def check_agent(db: Session, user: User, agent_id: Optional[uuid.UUID]) -> None:
    if agent_id is None:
        return
    agent = db.scalar(
        select(User).where(User.id == agent_id, User.agency_id == user.agency_id)
    )
    if not agent:
        raise HTTPException(
            status_code=422, detail="Assigned agent not found in your agency"
        )


def check_publish(status_value: str, is_published: bool) -> None:
    if is_published and status_value == "draft":
        raise HTTPException(
            status_code=422, detail="Draft properties cannot be published"
        )


def build_out(db: Session, prop: Property) -> PropertyOut:
    media = db.scalars(
        select(PropertyMedia)
        .where(PropertyMedia.property_id == prop.id)
        .order_by(PropertyMedia.sort_order, PropertyMedia.created_at)
    ).all()
    out = PropertyOut.model_validate(prop)
    out.media = [
        PropertyMediaOut(
            id=m.id,
            url=media_url(m.storage_key),
            caption=m.caption,
            sort_order=m.sort_order,
            is_cover=m.is_cover,
        )
        for m in media
    ]
    cover = next((m for m in media if m.is_cover), media[0] if media else None)
    out.cover_url = media_url(cover.storage_key) if cover else None
    return out


@router.post("", response_model=PropertyOut, status_code=201)
def create_property(
    data: PropertyCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
):
    check_agent(db, user, data.assigned_agent_id)
    check_publish(data.status, data.is_published)
    prop = Property(
        agency_id=user.agency_id,
        reference_code="AQ-" + uuid.uuid4().hex[:8].upper(),
        **data.model_dump(),
    )
    db.add(prop)
    db.commit()
    db.refresh(prop)
    return build_out(db, prop)


@router.get("", response_model=PropertyList)
def list_properties(
    q: Optional[str] = None,
    purpose: Optional[Purpose] = None,
    property_type: Optional[PropertyType] = None,
    city: Optional[str] = None,
    status_filter: Optional[PropertyStatus] = Query(None, alias="status"),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    bedrooms: Optional[int] = Query(None, ge=0),
    is_published: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = select(Property).where(Property.agency_id == user.agency_id)
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(
                Property.title.ilike(like),
                Property.reference_code.ilike(like),
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
    if status_filter:
        stmt = stmt.where(Property.status == status_filter)
    if min_price is not None:
        stmt = stmt.where(Property.price >= min_price)
    if max_price is not None:
        stmt = stmt.where(Property.price <= max_price)
    if bedrooms is not None:
        stmt = stmt.where(Property.bedrooms >= bedrooms)
    if is_published is not None:
        stmt = stmt.where(Property.is_published == is_published)

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = db.scalars(
        stmt.order_by(Property.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
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

    items = []
    for r in rows:
        out = PropertyOut.model_validate(r)
        cover = covers.get(r.id)
        out.cover_url = media_url(cover.storage_key) if cover else None
        items.append(out)
    return PropertyList(items=items, total=total, page=page, page_size=page_size)


@router.get("/{property_id}", response_model=PropertyOut)
def get_property(
    property_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return build_out(db, get_scoped(db, user, property_id))


@router.patch("/{property_id}", response_model=PropertyOut)
def update_property(
    property_id: uuid.UUID,
    data: PropertyUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
):
    prop = get_scoped(db, user, property_id)
    changes = data.model_dump(exclude_unset=True)
    for key in NOT_NULL:
        if key in changes and changes[key] is None:
            raise HTTPException(status_code=422, detail=f"{key} cannot be empty")
    check_agent(db, user, changes.get("assigned_agent_id"))
    check_publish(
        changes.get("status", prop.status),
        changes.get("is_published", prop.is_published),
    )
    for key, value in changes.items():
        setattr(prop, key, value)
    db.commit()
    db.refresh(prop)
    return build_out(db, prop)


@router.delete("/{property_id}", response_model=PropertyOut)
def archive_property(
    property_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
):
    prop = get_scoped(db, user, property_id)
    prop.status = "inactive"
    prop.is_published = False
    db.commit()
    db.refresh(prop)
    return build_out(db, prop)


@router.post("/{property_id}/media", response_model=PropertyOut, status_code=201)
def upload_media(
    property_id: uuid.UUID,
    file: UploadFile = File(...),
    caption: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
):
    prop = get_scoped(db, user, property_id)
    ext = ALLOWED_TYPES.get(file.content_type or "")
    if not ext:
        raise HTTPException(
            status_code=415, detail="Only JPEG, PNG or WebP images are allowed"
        )
    content = file.file.read(MAX_BYTES + 1)
    if len(content) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="Image must be 5 MB or smaller")
    if not looks_like_image(content):
        raise HTTPException(status_code=415, detail="File is not a valid image")

    count = db.scalar(
        select(func.count())
        .select_from(PropertyMedia)
        .where(PropertyMedia.property_id == prop.id)
    ) or 0
    if count >= MAX_IMAGES:
        raise HTTPException(
            status_code=422, detail=f"A property can have at most {MAX_IMAGES} images"
        )

    key = f"properties/{prop.id}/{uuid.uuid4().hex}{ext}"
    path = UPLOAD_DIR / key
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(content)

    db.add(
        PropertyMedia(
            agency_id=user.agency_id,
            property_id=prop.id,
            storage_key=key,
            caption=caption,
            sort_order=count,
            is_cover=(count == 0),
        )
    )
    db.commit()
    return build_out(db, prop)


@router.delete("/{property_id}/media/{media_id}", response_model=PropertyOut)
def delete_media(
    property_id: uuid.UUID,
    media_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
):
    prop = get_scoped(db, user, property_id)
    media = db.scalar(
        select(PropertyMedia).where(
            PropertyMedia.id == media_id,
            PropertyMedia.property_id == prop.id,
            PropertyMedia.agency_id == user.agency_id,
        )
    )
    if not media:
        raise HTTPException(status_code=404, detail="Image not found")
    was_cover = media.is_cover
    path = UPLOAD_DIR / media.storage_key
    db.delete(media)
    db.commit()
    path.unlink(missing_ok=True)
    if was_cover:
        first = db.scalar(
            select(PropertyMedia)
            .where(PropertyMedia.property_id == prop.id)
            .order_by(PropertyMedia.sort_order, PropertyMedia.created_at)
        )
        if first:
            first.is_cover = True
            db.commit()
    return build_out(db, prop)
