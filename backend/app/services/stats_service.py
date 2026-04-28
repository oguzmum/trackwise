from datetime import date, timedelta
from calendar import monthrange
from sqlalchemy.orm import Session
from ..models import Entry, Habit


def get_period_range(period: str) -> tuple[date, date]:
    today = date.today()
    if period == "month":
        start = today.replace(day=1)
    elif period == "quarter":
        quarter_start_month = (today.month - 1) // 3 * 3 + 1
        start = today.replace(month=quarter_start_month, day=1)
    elif period == "year":
        start = today.replace(month=1, day=1)
    else:
        start = today.replace(day=1)
    return start, today


def compute_habit_stats(habit_id: int, period: str, db: Session) -> dict:
    start, end = get_period_range(period)
    entries = db.query(Entry).filter(
        Entry.habit_id == habit_id,
        Entry.date >= start,
        Entry.date <= end,
    ).all()

    entry_map = {e.date: e.completed for e in entries}
    days_total = (end - start).days + 1
    days_completed = sum(1 for e in entries if e.completed)
    completion_rate = days_completed / days_total if days_total > 0 else 0.0

    # Longest streak over the period
    longest_streak = 0
    cur = 0
    d = start
    while d <= end:
        if entry_map.get(d, False):
            cur += 1
            if cur > longest_streak:
                longest_streak = cur
        else:
            cur = 0
        d += timedelta(days=1)

    # Current streak: consecutive completed days ending at today (backwards)
    current_streak = 0
    d = end
    while d >= start:
        if entry_map.get(d, False):
            current_streak += 1
        else:
            break
        d -= timedelta(days=1)

    return {
        "habit_id": habit_id,
        "period": period,
        "completion_rate": round(completion_rate, 4),
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "days_completed": days_completed,
        "days_total": days_total,
    }


def compute_category_stats(category_id: int, period: str, db: Session) -> dict:
    start, end = get_period_range(period)
    habits = (
        db.query(Habit)
        .filter(Habit.category_id == category_id, Habit.is_active.is_(True))
        .all()
    )
    habit_ids = [h.id for h in habits]
    if not habit_ids:
        return {
            "category_id": category_id,
            "period": period,
            "completion_rate": 0.0,
            "total_habits": 0,
            "days_completed": 0,
            "days_total": 0,
        }

    entries = db.query(Entry).filter(
        Entry.habit_id.in_(habit_ids),
        Entry.date >= start,
        Entry.date <= end,
    ).all()

    days_total = ((end - start).days + 1) * len(habit_ids)
    days_completed = sum(1 for e in entries if e.completed)
    completion_rate = days_completed / days_total if days_total > 0 else 0.0

    return {
        "category_id": category_id,
        "period": period,
        "completion_rate": round(completion_rate, 4),
        "total_habits": len(habit_ids),
        "days_completed": days_completed,
        "days_total": days_total,
    }


def compute_overview(period: str, db: Session) -> dict:
    habits = db.query(Habit).filter(Habit.is_active.is_(True)).all()
    if not habits:
        return {
            "period": period,
            "avg_completion_rate": 0.0,
            "best_habit": None,
            "worst_habit": None,
        }

    rates = []
    for h in habits:
        stats = compute_habit_stats(h.id, period, db)
        rates.append((h.name, stats["completion_rate"]))

    avg_rate = sum(r for _, r in rates) / len(rates)
    best = max(rates, key=lambda x: x[1])[0]
    worst = min(rates, key=lambda x: x[1])[0]

    return {
        "period": period,
        "avg_completion_rate": round(avg_rate, 4),
        "best_habit": best,
        "worst_habit": worst,
    }


def compute_heatmap(habit_id: int, year: int, db: Session) -> dict:
    start = date(year, 1, 1)
    end = min(date(year, 12, 31), date.today())

    entries = db.query(Entry).filter(
        Entry.habit_id == habit_id,
        Entry.date >= start,
        Entry.date <= end,
    ).all()

    entry_map = {e.date: e.completed for e in entries}
    result = []
    d = start
    while d <= end:
        result.append({"date": d, "completed": entry_map.get(d, False)})
        d += timedelta(days=1)

    return {"habit_id": habit_id, "year": year, "entries": result}
