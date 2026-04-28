from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import CategoryStats, HabitStats, HeatmapData, OverviewStats
from ..services.stats_service import (
    compute_category_stats,
    compute_habit_stats,
    compute_heatmap,
    compute_overview,
)

router = APIRouter()

PERIOD_PATTERN = "^(month|quarter|year)$"


@router.get("/habit/{habit_id}", response_model=HabitStats)
def habit_stats(
    habit_id: int,
    period: str = Query("month", pattern=PERIOD_PATTERN),
    db: Session = Depends(get_db),
):
    return compute_habit_stats(habit_id, period, db)


@router.get("/category/{category_id}", response_model=CategoryStats)
def category_stats(
    category_id: int,
    period: str = Query("month", pattern=PERIOD_PATTERN),
    db: Session = Depends(get_db),
):
    return compute_category_stats(category_id, period, db)


@router.get("/overview", response_model=OverviewStats)
def overview_stats(
    period: str = Query("month", pattern=PERIOD_PATTERN),
    db: Session = Depends(get_db),
):
    return compute_overview(period, db)


@router.get("/heatmap", response_model=HeatmapData)
def heatmap(
    habit_id: int,
    year: int = Query(..., ge=2000, le=2100),
    db: Session = Depends(get_db),
):
    return compute_heatmap(habit_id, year, db)
