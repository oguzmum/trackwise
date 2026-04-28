from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Habit
from ..schemas import HabitCreate, HabitOut, HabitUpdate

router = APIRouter()


@router.get("/", response_model=list[HabitOut])
def list_habits(active: Optional[bool] = None, db: Session = Depends(get_db)):
    q = db.query(Habit)
    if active is not None:
        q = q.filter(Habit.is_active == active)
    return q.all()


@router.post("/", response_model=HabitOut, status_code=201)
def create_habit(data: HabitCreate, db: Session = Depends(get_db)):
    habit = Habit(**data.model_dump())
    db.add(habit)
    db.commit()
    db.refresh(habit)
    return habit


@router.put("/{habit_id}", response_model=HabitOut)
def update_habit(habit_id: int, data: HabitUpdate, db: Session = Depends(get_db)):
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    for k, v in data.model_dump().items():
        setattr(habit, k, v)
    db.commit()
    db.refresh(habit)
    return habit


@router.patch("/{habit_id}/toggle", response_model=HabitOut)
def toggle_habit(habit_id: int, db: Session = Depends(get_db)):
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    habit.is_active = not habit.is_active
    db.commit()
    db.refresh(habit)
    return habit


@router.delete("/{habit_id}", status_code=204)
def delete_habit(habit_id: int, db: Session = Depends(get_db)):
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    db.delete(habit)
    db.commit()
