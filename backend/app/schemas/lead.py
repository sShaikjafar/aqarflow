import uuid
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

LeadStage = Literal[
    "new",
    "contacted",
    "qualified",
    "visit_scheduled",
    "negotiation",
    "converted",
    "lost",
]


class ContactOut(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None


class LeadProperty(BaseModel):
    id: uuid.UUID
    title: str
    reference_code: str
    city: str
    locality: Optional[str] = None


class AgentOut(BaseModel):
    id: uuid.UUID
    full_name: str
    role: str = "agent"


class ActivityOut(BaseModel):
    id: uuid.UUID
    activity_type: str
    body: str
    author: Optional[str] = None
    created_at: datetime


class LeadOut(BaseModel):
    id: uuid.UUID
    stage: str
    source: str
    message: Optional[str] = None
    preferred_contact: str
    created_at: datetime
    updated_at: datetime
    contact: ContactOut
    property: Optional[LeadProperty] = None
    assigned_agent: Optional[AgentOut] = None


class LeadDetail(LeadOut):
    activities: list[ActivityOut] = Field(default_factory=list)


class LeadList(BaseModel):
    items: list[LeadOut]
    total: int
    page: int
    page_size: int


class StageUpdate(BaseModel):
    stage: LeadStage


class NoteCreate(BaseModel):
    body: str = Field(min_length=1, max_length=2000)


class AssignRequest(BaseModel):
    agent_id: Optional[uuid.UUID] = None
