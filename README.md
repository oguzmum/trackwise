# Trackwise

A personal habit tracking web app with statistics and visual insights.

## Idea 

- Track daily habits across custom categories (fitness, learning, health, etc.)
- Monthly grid view inspired by paper habit trackers
- Statistics per habit, category, and overall: completion rates, streaks, heatmaps, trends
- OCR import (planned): take a photo of your paper tracker and auto-fill entries

---

## Setup & Run

**Backend** (Python 3.11+):

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API docs available at [http://localhost:8000/docs](http://localhost:8000/docs).  
DB (`trackwise.db`) is created automatically on first start.

**Tests:**

```bash
cd backend
pytest
```

---

Built with the help of [Claude Code](https://claude.ai/code) and [Claude Design](https://claude.ai).

The original UI mockups created with Claude Design are under `./design/`.