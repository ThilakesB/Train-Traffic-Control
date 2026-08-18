"""
SIH25022 — AI-Powered Train Traffic Control
FastAPI backend entry point.

Run:  uvicorn main:app --reload
"""
import uuid
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import store
from models import Train, TrainCreate, OverrideRequest, ScheduleResult
from scheduler import compute_schedule

# Seed data on module load
store.seed_trains()

app = FastAPI(
    title="SIH25022 Train Traffic Control API",
    description="AI-powered scheduling for single-section railway bottleneck",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/", tags=["meta"])
def root():
    return {"status": "ok", "service": "SIH25022 Train Traffic Control API"}


# ── Trains ────────────────────────────────────────────────────────────────────

@app.get("/trains", response_model=list[Train], tags=["trains"])
def list_trains():
    """Return all trains currently approaching the section."""
    return store.get_all_trains()


@app.post("/trains", response_model=Train, status_code=201, tags=["trains"])
def add_train(payload: TrainCreate):
    """Add a new train to the approaching queue."""
    train = Train(
        id=f"TRN-{str(uuid.uuid4())[:6].upper()}",
        **payload.model_dump(),
    )
    store.add_train(train)
    # Clear any pending override since the train list changed
    store.clear_override()
    return train


# ── Schedule ──────────────────────────────────────────────────────────────────

@app.get("/schedule", response_model=ScheduleResult, tags=["schedule"])
def get_schedule():
    """
    Run the scheduling algorithm and return the computed passing order.

    If a controller override is pending, that ordering is used instead of
    the algorithmic sort.
    """
    trains = store.get_all_trains()
    if not trains:
        raise HTTPException(status_code=404, detail="No trains in the system")
    override = store.get_override()
    return compute_schedule(trains, ordered_ids=override)


@app.post("/schedule/override", response_model=ScheduleResult, tags=["schedule"])
def override_schedule(payload: OverrideRequest):
    """
    Controller manually reorders the passing sequence.

    Accepts a full ordered list of train IDs representing the desired schedule.
    Returns the recomputed schedule using this ordering.
    """
    trains = store.get_all_trains()
    known_ids = {t.id for t in trains}
    for tid in payload.ordered_train_ids:
        if tid not in known_ids:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown train ID: {tid}",
            )
    store.set_override(payload.ordered_train_ids)
    return compute_schedule(trains, ordered_ids=payload.ordered_train_ids)


@app.post("/schedule/confirm", tags=["schedule"])
def confirm_schedule():
    """
    Controller confirms the current schedule (algorithmic or overridden).
    MVP: logs intent and clears override state. In production this would
    trigger interlocking / signal system commands.
    """
    override = store.get_override()
    source = "controller-override" if override else "ai-scheduler"
    store.clear_override()
    return {
        "status": "confirmed",
        "source": source,
        "message": "Schedule confirmed by controller. Interlocking commands would be dispatched in production.",
    }


@app.delete("/schedule/override", tags=["schedule"])
def cancel_override():
    """Cancel a pending override and revert to the algorithmic schedule."""
    store.clear_override()
    return {"status": "ok", "message": "Override cancelled; reverting to AI-computed schedule."}
