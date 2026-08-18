# 🚆 Train Traffic Control — SIH25022

> **AI-Powered Precise Train Traffic Control Software**  
> Smart India Hackathon 2025 · Problem Statement SIH25022

A human-in-the-loop scheduling system that maximises single-section railway throughput by computing a conflict-free train passing order using priority-based AI scheduling — with full controller override support.

---

## 📸 Screenshots

| Dashboard | Computed Schedule |
|---|---|
| ![Dashboard](https://raw.githubusercontent.com/ThilakesB/Train-Traffic-Control/main/docs/dashboard.png) | ![Schedule](https://raw.githubusercontent.com/ThilakesB/Train-Traffic-Control/main/docs/schedule.png) |

---

## 🎯 Problem Statement

A single railway section (block) can only carry **one train at a time**. Multiple trains — Express, Passenger, and Freight — approach the same section simultaneously with different priorities and ETAs. Without coordination, trains collide or face indefinite delays.

This system:
1. **Computes** a conflict-free passing order (AI scheduler)
2. **Explains** why each train got its slot (human-readable reasons)
3. **Lets the controller approve or override** before any decision is acted upon

---

## ✨ Features

- 🧠 **AI Scheduler** — Priority-first (Express > Passenger > Freight), ETA tiebreaker, conflict detection
- 📋 **Conflict Resolution** — Detects overlapping section-occupancy windows and resolves them with sequencing
- 🧑‍✈️ **Human Override** — Controller can reorder slots with ▲▼ buttons and submit a custom schedule
- ✅ **Accept / Re-run** — Confirm the AI schedule or re-run after changes
- 🔌 **Swappable Algorithm** — `scheduler.py` is a pure isolated module; drop in OR-Tools or RL without touching the API
- 🌑 **Dark Ops-Center UI** — Navy + amber theme, type badges, priority indicators, entry/exit time timeline

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Vanilla CSS (design system tokens) |
| Backend | Python 3.13 + FastAPI |
| Validation | Pydantic v2 |
| Data | In-memory store (synthetic seed data) |
| Comms | REST API (JSON) |

---

## 📁 Project Structure

```
Train-Traffic-Control/
│
├── backend/
│   ├── main.py          # FastAPI app — routes, CORS, startup
│   ├── models.py        # Pydantic models (Train, Section, ScheduleResult…)
│   ├── scheduler.py     # 🧠 Isolated scheduling algorithm (swappable)
│   ├── store.py         # In-memory data store + 5 seed trains
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   ├── types.ts          # TypeScript interfaces (mirrors Pydantic models)
    │   │   └── client.ts         # Typed fetch wrapper for all endpoints
    │   ├── hooks/
    │   │   ├── useTrains.ts      # Fetch & manage train list state
    │   │   └── useSchedule.ts    # Schedule state machine (idle→computed→confirmed)
    │   ├── components/
    │   │   ├── TrainTable/       # Approaching trains table
    │   │   ├── ScheduleTimeline/ # Numbered slot cards with override controls
    │   │   └── ControlPanel/     # Action buttons & status badge
    │   ├── App.tsx
    │   └── index.css             # Full design system (tokens, animations, responsive)
    ├── index.html
    ├── vite.config.ts
    └── tsconfig.json
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+

### 1. Clone

```bash
git clone https://github.com/ThilakesB/Train-Traffic-Control.git
cd Train-Traffic-Control
```

### 2. Start the Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at **http://localhost:8000**  
Interactive API docs at **http://localhost:8000/docs**

### 3. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**

---

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/trains` | List all approaching trains |
| `POST` | `/trains` | Add a new train |
| `GET` | `/schedule` | Run scheduler, get computed passing order |
| `POST` | `/schedule/override` | Submit a manually reordered schedule |
| `POST` | `/schedule/confirm` | Confirm the current schedule (human approval) |
| `DELETE` | `/schedule/override` | Cancel override, revert to AI schedule |

### Schedule Response Example

```json
{
  "section_id": "SEC-001",
  "computed_at": "2025-08-18T05:30:00Z",
  "total_trains": 5,
  "entries": [
    {
      "slot_index": 0,
      "train_id": "TRN-101",
      "train_name": "Rajdhani Express",
      "train_type": "express",
      "priority": 3,
      "eta_seconds": 120,
      "entry_time_seconds": 120,
      "exit_time_seconds": 180,
      "reason": "Express 'Rajdhani Express' assigned first slot — highest priority P1 (Highest) and earliest ETA (120s).",
      "conflict_resolved": false
    }
  ]
}
```

---

## 🧠 Scheduling Algorithm

Located in [`backend/scheduler.py`](backend/scheduler.py) — a **pure function**, fully isolated from the API layer.

**Algorithm (MVP):**
1. Sort trains by **priority DESC** (Express=3, Passenger=2, Freight=1)
2. Break ties by **ETA ASC** (earlier arrival wins within same priority)
3. Assign slots sequentially — each train enters after the previous exits (60s section transit)
4. Detect **conflicts** (overlapping occupancy windows at naive ETAs)
5. Generate **human-readable reason strings** for every slot

**To swap in a better optimizer** (e.g. OR-Tools, RL policy):
```python
# scheduler.py — replace compute_schedule() with your own implementation
def compute_schedule(trains: list[Train], ordered_ids: list[str] | None = None) -> ScheduleResult:
    # your OR-Tools / RL logic here
    ...
```
No other files need changing.

---

## 🚂 Seed Data

The backend starts with 5 synthetic trains:

| ID | Name | Type | ETA | Speed |
|---|---|---|---|---|
| TRN-101 | Rajdhani Express | ⚡ Express | 2m | 130 km/h |
| TRN-202 | Mahanagari Passenger | 🧑 Passenger | 1m 30s | 80 km/h |
| TRN-303 | Coal Freight #7 | 📦 Freight | 1m 15s | 60 km/h |
| TRN-404 | Duronto Express | ⚡ Express | 3m 20s | 120 km/h |
| TRN-505 | Goods Carrier #3 | 📦 Freight | 3m | 55 km/h |

---

## 🔭 Scope (MVP)

**In scope:**
- Single-section, single-bottleneck scheduling
- Priority + ETA conflict resolution
- Human controller approve / override flow
- Synthetic in-memory data

**Out of scope (future work):**
- Live sensor / GPS / track-circuit data ingestion
- Signal or interlocking system integration
- Auto-execution without human approval
- Multi-section network topology
- Model retraining / feedback loop

---

## 👤 Author

**Thilakeswaran B**  
Smart India Hackathon 2025 · SIH25022

---

## 📄 License

[MIT](LICENSE)
