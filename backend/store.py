"""
In-memory data store with synthetic seed data.
Replace with SQLite or a real DB without touching the API layer.
"""
import uuid
from models import Train, TrainType, Section

# ── Singleton section ────────────────────────────────────────────────────────
SECTION = Section(
    id="SEC-001",
    name="Nagpur–Itarsi Single-Line Block",
    capacity=1,
    transit_time_seconds=60,
)

# ── In-memory train store ────────────────────────────────────────────────────
trains: dict[str, Train] = {}

# ── Override state (stores manually reordered list of train IDs) ─────────────
# None means "use scheduler output"; set to a list after POST /schedule/override
pending_override: list[str] | None = None


def seed_trains() -> None:
    """Populate 5 synthetic approaching trains."""
    global trains
    seed: list[dict] = [
        {
            "id": "TRN-101",
            "name": "Rajdhani Express",
            "type": TrainType.express,
            "eta_seconds": 120,
            "speed_kmh": 130.0,
            "current_position_km": 4.3,
        },
        {
            "id": "TRN-202",
            "name": "Mahanagari Passenger",
            "type": TrainType.passenger,
            "eta_seconds": 90,
            "speed_kmh": 80.0,
            "current_position_km": 2.0,
        },
        {
            "id": "TRN-303",
            "name": "Coal Freight #7",
            "type": TrainType.freight,
            "eta_seconds": 75,
            "speed_kmh": 60.0,
            "current_position_km": 1.25,
        },
        {
            "id": "TRN-404",
            "name": "Duronto Express",
            "type": TrainType.express,
            "eta_seconds": 200,
            "speed_kmh": 120.0,
            "current_position_km": 6.7,
        },
        {
            "id": "TRN-505",
            "name": "Goods Carrier #3",
            "type": TrainType.freight,
            "eta_seconds": 180,
            "speed_kmh": 55.0,
            "current_position_km": 3.3,
        },
    ]
    trains = {t["id"]: Train(**t) for t in seed}


def get_all_trains() -> list[Train]:
    return list(trains.values())


def add_train(train: Train) -> Train:
    trains[train.id] = train
    return train


def set_override(ordered_ids: list[str]) -> None:
    global pending_override
    pending_override = ordered_ids


def clear_override() -> None:
    global pending_override
    pending_override = None


def get_override() -> list[str] | None:
    return pending_override
