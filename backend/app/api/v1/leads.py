import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.core.database import get_db
from app.models.activity import Activity
from app.models.lead import Contact, Lead
from app.models.property import Property
from app.models.user import User
from app.schemas.lead import (
    ActivityOut,
    AgentOut,
    AssignRequest,
    ContactOut,
    LeadDetail,
    LeadList,
    LeadOut,
    LeadProperty,
    LeadStage,
    NoteCreate,
    StageUpdate,
)

router = APIRouter(prefix="/leads", tags=["leads"])


def nice(value: str) -> str:
    return value.replace("_", " ")


def scoped(stmt, user: User):
    stmt = stmt.where(Lead.agency_id == user.agency_id)
    if user.role != "admin":
        stmt = stmt.where(Lead.assigned_agent_id == user.id)
    return stmt


def get_lead(db: Session, user: User, lead_id: uuid.UUID) -> Lead:
    lead = db.scalar(scoped(select(Lead), user).where(Lead.id == lead_id))
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


def build_many(db: Session, leads: list[Lead]) -> list[LeadOut]:
    contact_ids = {l.contact_id for l in leads}
    prop_ids = {l.property_id for l in leads if l.property_id}
    agent_ids = {l.assigned_agent_id for l in leads if l.assigned_agent_id}

    contacts = (
        {c.id: c for c in db.scalars(select(Contact).where(Contact.id.in_(contact_ids)))}
        if contact_ids
        else {}
    )
    props = (
        {p.id: p for p in db.scalars(select(Property).where(Property.id.in_(prop_ids)))}
        if prop_ids
        else {}
    )
    agents = (
        {u.id: u for u in db.scalars(select(User).where(User.id.in_(agent_ids)))}
        if agent_ids
        else {}
    )

    out = []
    for l in leads:
        c = contacts[l.contact_id]
        p = props.get(l.property_id)
        a = agents.get(l.assigned_agent_id)
        out.append(
            LeadOut(
                id=l.id,
                stage=l.stage,
                source=l.source,
                message=l.message,
                preferred_contact=l.preferred_contact,
                created_at=l.created_at,
                updated_at=l.updated_at,
                contact=ContactOut(name=c.name, phone=c.phone, email=c.email),
                property=(
                    LeadProperty(
                        id=p.id,
                        title=p.title,
                        reference_code=p.reference_code,
                        city=p.city,
                        locality=p.locality,
                    )
                    if p
                    else None
                ),
                assigned_agent=(
                    AgentOut(id=a.id, full_name=a.full_name, role=a.role) if a else None
                ),
            )
        )
    return out


def detail(db: Session, lead: Lead) -> LeadDetail:
    base = build_many(db, [lead])[0]
    rows = db.execute(
        select(Activity, User.full_name)
        .outerjoin(User, User.id == Activity.user_id)
        .where(Activity.lead_id == lead.id)
        .order_by(Activity.created_at.desc())
    ).all()
    activities = [
        ActivityOut(
            id=a.id,
            activity_type=a.activity_type,
            body=a.body,
            author=name,
            created_at=a.created_at,
        )
        for a, name in rows
    ]
    return LeadDetail(**base.model_dump(), activities=activities)


def log(db: Session, user: User, lead: Lead, kind: str, body: str) -> None:
    db.add(
        Activity(
            agency_id=user.agency_id,
            lead_id=lead.id,
            user_id=user.id,
            activity_type=kind,
            body=body,
        )
    )


@router.get("/agents", response_model=list[AgentOut])
def list_agents(db: Session = Depends(get_db), user: User = Depends(require_admin)):
    rows = db.scalars(
        select(User)
        .where(User.agency_id == user.agency_id, User.status == "active")
        .order_by(User.full_name)
    ).all()
    return [AgentOut(id=u.id, full_name=u.full_name, role=u.role) for u in rows]


@router.get("", response_model=LeadList)
def list_leads(
    q: Optional[str] = None,
    stage: Optional[LeadStage] = None,
    agent_id: Optional[uuid.UUID] = None,
    unassigned: bool = False,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = scoped(select(Lead), user).join(Contact, Contact.id == Lead.contact_id)
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(
                Contact.name.ilike(like),
                Contact.email.ilike(like),
                Contact.phone.ilike(like),
            )
        )
    if stage:
        stmt = stmt.where(Lead.stage == stage)
    if user.role == "admin":
        if unassigned:
            stmt = stmt.where(Lead.assigned_agent_id.is_(None))
        elif agent_id:
            stmt = stmt.where(Lead.assigned_agent_id == agent_id)

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = db.scalars(
        stmt.order_by(Lead.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return LeadList(
        items=build_many(db, list(rows)),
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{lead_id}", response_model=LeadDetail)
def get_one(
    lead_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return detail(db, get_lead(db, user, lead_id))


@router.patch("/{lead_id}/stage", response_model=LeadDetail)
def update_stage(
    lead_id: uuid.UUID,
    data: StageUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    lead = get_lead(db, user, lead_id)
    if data.stage != lead.stage:
        old = lead.stage
        lead.stage = data.stage
        log(
            db,
            user,
            lead,
            "stage_change",
            f"Stage changed from {nice(old)} to {nice(data.stage)}",
        )
        db.commit()
        db.refresh(lead)
    return detail(db, lead)


@router.post("/{lead_id}/notes", response_model=LeadDetail, status_code=201)
def add_note(
    lead_id: uuid.UUID,
    data: NoteCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    lead = get_lead(db, user, lead_id)
    log(db, user, lead, "note", data.body.strip())
    db.commit()
    db.refresh(lead)
    return detail(db, lead)


@router.post("/{lead_id}/assign", response_model=LeadDetail)
def assign(
    lead_id: uuid.UUID,
    data: AssignRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
):
    lead = get_lead(db, user, lead_id)
    if data.agent_id is None:
        lead.assigned_agent_id = None
        text = "Lead unassigned"
    else:
        agent = db.scalar(
            select(User).where(
                User.id == data.agent_id,
                User.agency_id == user.agency_id,
                User.status == "active",
            )
        )
        if not agent:
            raise HTTPException(
                status_code=422, detail="Agent not found in your agency"
            )
        lead.assigned_agent_id = agent.id
        text = "Assigned to " + agent.full_name
    log(db, user, lead, "assignment", text)
    db.commit()
    db.refresh(lead)
    return detail(db, lead)