from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


# --- Category ---

class CategoryBase(BaseModel):
    name: str
    color: str


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(CategoryBase):
    pass


class CategoryOut(CategoryBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Habit ---

class HabitBase(BaseModel):
    name: str
    category_id: Optional[int] = None
    frequency: str = "daily"
    frequency_target: Optional[int] = None


class HabitCreate(HabitBase):
    pass


class HabitUpdate(HabitBase):
    pass


class HabitOut(HabitBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryOut] = None

    model_config = {"from_attributes": True}


# --- Entry ---

class EntryBase(BaseModel):
    habit_id: int
    date: date
    completed: bool = False
    note: Optional[str] = None


class EntryCreate(EntryBase):
    pass


class EntryUpdate(BaseModel):
    completed: Optional[bool] = None
    note: Optional[str] = None


class EntryOut(EntryBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class BulkEntryCreate(BaseModel):
    entries: list[EntryCreate]


# --- Stats ---

class HabitStats(BaseModel):
    habit_id: int
    period: str
    completion_rate: float
    current_streak: int
    longest_streak: int
    days_completed: int
    days_total: int


class CategoryStats(BaseModel):
    category_id: int
    period: str
    completion_rate: float
    total_habits: int
    days_completed: int
    days_total: int


class OverviewStats(BaseModel):
    period: str
    avg_completion_rate: float
    best_habit: Optional[str]
    worst_habit: Optional[str]


class HeatmapEntry(BaseModel):
    date: date
    completed: bool


class HeatmapData(BaseModel):
    habit_id: int
    year: int
    entries: list[HeatmapEntry]
