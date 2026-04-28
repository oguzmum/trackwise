from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import habits, entries, categories, stats

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Trackwise API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(categories.router, prefix="/api/categories", tags=["categories"])
app.include_router(habits.router, prefix="/api/habits", tags=["habits"])
app.include_router(entries.router, prefix="/api/entries", tags=["entries"])
app.include_router(stats.router, prefix="/api/stats", tags=["stats"])
