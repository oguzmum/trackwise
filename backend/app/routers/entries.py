import datetime
from calendar import monthrange
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Entry
from ..schemas import BulkEntryCreate, EntryCreate, EntryOut, EntryUpdate

router = APIRouter()


@router.get("/", response_model=list[EntryOut])
def list_entries(
    date: Optional[datetime.date] = None,
    habit_id: Optional[int] = None,
    month: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(Entry)
    if date:
        q = q.filter(Entry.date == date)
    if habit_id:
        q = q.filter(Entry.habit_id == habit_id)
    if month:
        try:
            year, m = map(int, month.split("-"))
        except ValueError:
            raise HTTPException(status_code=400, detail="month must be YYYY-MM")
        last_day = monthrange(year, m)[1]
        start = datetime.date(year, m, 1)
        end = datetime.date(year, m, last_day)
        q = q.filter(and_(Entry.date >= start, Entry.date <= end))
    return q.all()


@router.post("/", response_model=EntryOut, status_code=201)
def upsert_entry(data: EntryCreate, db: Session = Depends(get_db)):
    existing = db.query(Entry).filter(
        Entry.habit_id == data.habit_id,
        Entry.date == data.date,
    ).first()
    if existing:
        existing.completed = data.completed
        if data.note is not None:
            existing.note = data.note
        db.commit()
        db.refresh(existing)
        return existing
    entry = Entry(**data.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.patch("/{entry_id}", response_model=EntryOut)
def update_entry(entry_id: int, data: EntryUpdate, db: Session = Depends(get_db)):
    entry = db.query(Entry).filter(Entry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(entry, k, v)
    db.commit()
    db.refresh(entry)
    return entry


@router.post("/bulk", response_model=list[EntryOut], status_code=201)
def bulk_create_entries(data: BulkEntryCreate, db: Session = Depends(get_db)):
    results = []
    for item in data.entries:
        existing = db.query(Entry).filter(
            Entry.habit_id == item.habit_id,
            Entry.date == item.date,
        ).first()
        if existing:
            existing.completed = item.completed
            if item.note is not None:
                existing.note = item.note
            db.flush()
            results.append(existing)
        else:
            entry = Entry(**item.model_dump())
            db.add(entry)
            db.flush()
            results.append(entry)
    db.commit()
    for e in results:
        db.refresh(e)
    return results
