from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, model_validator
from datetime import datetime


class TrainType(str, Enum):
    express = "express"
    passenger = "passenger"
    freight = "freight"


PRIORITY_MAP: dict[TrainType, int] = {
    TrainType.express: 3,
    TrainType.passenger: 2,
    TrainType.freight: 1,
}


class Train(BaseModel):
    id: str
    name: str
    type: TrainType
    priority: int = Field(default=0, description="Derived from type; auto-set on creation")
    eta_seconds: int = Field(..., description="Estimated seconds until reaching the section")
    speed_kmh: float = Field(default=80.0)
    current_position_km: float = Field(default=0.0)

    @model_validator(mode="after")
    def set_priority(self) -> "Train":
        self.priority = PRIORITY_MAP[self.type]
        return self


class TrainCreate(BaseModel):
    name: str
    type: TrainType
    eta_seconds: int
    speed_kmh: float = 80.0
    current_position_km: float = 0.0


class Section(BaseModel):
    id: str
    name: str
    capacity: int = 1
    transit_time_seconds: int = Field(
        default=60, description="How long a train occupies the section"
    )


class ScheduleEntry(BaseModel):
    slot_index: int
    train_id: str
    train_name: str
    train_type: TrainType
    priority: int
    eta_seconds: int
    entry_time_seconds: int = Field(
        ..., description="Absolute seconds from now when train enters section"
    )
    exit_time_seconds: int
    reason: str
    conflict_resolved: bool = False


class ScheduleResult(BaseModel):
    section_id: str
    computed_at: str
    entries: list[ScheduleEntry]
    total_trains: int


class OverrideRequest(BaseModel):
    ordered_train_ids: list[str] = Field(
        ..., description="Full ordered list of train IDs representing the desired passing order"
    )
