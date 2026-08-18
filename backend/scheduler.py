"""
Scheduling algorithm — isolated, pure, swappable module.

Replace this entire module with OR-Tools, a RL policy, or any optimizer
without touching main.py or the API layer.

Algorithm (MVP):
  1. Sort trains by priority DESC, then by eta_seconds ASC (tiebreaker).
  2. Assign section slots sequentially: each slot starts after the previous train exits.
  3. Detect conflicts (two trains whose naive ETAs would overlap the section window).
  4. Generate a human-readable reason string for each slot.
"""

from datetime import datetime, timezone
from models import Train, ScheduleEntry, ScheduleResult, PRIORITY_MAP, TrainType

SECTION_TRANSIT_SECONDS = 60  # how long a train occupies the section
TYPE_LABELS: dict[TrainType, str] = {
    TrainType.express: "Express",
    TrainType.passenger: "Passenger",
    TrainType.freight: "Freight",
}
PRIORITY_LABELS: dict[int, str] = {3: "P1 (Highest)", 2: "P2 (Medium)", 1: "P3 (Lowest)"}


def _detect_conflict(a: Train, b: Train) -> bool:
    """Return True if trains a and b would collide inside the section at their naive ETAs."""
    a_entry, a_exit = a.eta_seconds, a.eta_seconds + SECTION_TRANSIT_SECONDS
    b_entry, b_exit = b.eta_seconds, b.eta_seconds + SECTION_TRANSIT_SECONDS
    return a_entry < b_exit and b_entry < a_exit


def _build_reason(train: Train, slot_index: int, bumped_over: list[Train], conflict_with: list[Train]) -> tuple[str, bool]:
    """Produce a human-readable scheduling rationale and conflict_resolved flag."""
    conflict_resolved = len(conflict_with) > 0

    if slot_index == 0 and not bumped_over:
        reason = (
            f"{TYPE_LABELS[train.type]} '{train.name}' assigned first slot — "
            f"highest priority {PRIORITY_LABELS[train.priority]} and earliest ETA ({train.eta_seconds}s)."
        )
    elif bumped_over:
        bumped_names = ", ".join(f"'{b.name}'" for b in bumped_over)
        reason = (
            f"{TYPE_LABELS[train.type]} '{train.name}' prioritized over {bumped_names} "
            f"— {PRIORITY_LABELS[train.priority]} outranks their lower precedence."
        )
        if conflict_resolved:
            conflict_names = ", ".join(f"'{c.name}'" for c in conflict_with)
            reason += f" Conflict with {conflict_names} resolved by sequencing."
    else:
        if conflict_resolved:
            conflict_names = ", ".join(f"'{c.name}'" for c in conflict_with)
            reason = (
                f"{TYPE_LABELS[train.type]} '{train.name}' queued at slot {slot_index + 1} — "
                f"conflict with {conflict_names} resolved; section available at computed entry time."
            )
        else:
            reason = (
                f"{TYPE_LABELS[train.type]} '{train.name}' queued at slot {slot_index + 1} — "
                f"{PRIORITY_LABELS[train.priority]}, ETA {train.eta_seconds}s."
            )
    return reason, conflict_resolved


def compute_schedule(trains: list[Train], ordered_ids: list[str] | None = None) -> ScheduleResult:
    """
    Compute a conflict-free passing schedule.

    Args:
        trains: All trains approaching the section.
        ordered_ids: If provided (from a controller override), use this ordering
                     instead of the algorithmic sort.

    Returns:
        ScheduleResult with ordered ScheduleEntry list and human-readable reasons.
    """
    if not trains:
        return ScheduleResult(
            section_id="SEC-001",
            computed_at=datetime.now(timezone.utc).isoformat(),
            entries=[],
            total_trains=0,
        )

    train_map = {t.id: t for t in trains}

    if ordered_ids:
        # Controller override: respect given order, ignore missing IDs gracefully
        sorted_trains = [train_map[tid] for tid in ordered_ids if tid in train_map]
        # Append any trains not in the override list at the end
        override_set = set(ordered_ids)
        sorted_trains += [t for t in trains if t.id not in override_set]
    else:
        # Algorithmic sort: priority DESC, then eta ASC
        sorted_trains = sorted(trains, key=lambda t: (-t.priority, t.eta_seconds))

    entries: list[ScheduleEntry] = []
    # Track next available section entry time
    next_available = 0  # seconds from now

    for slot_index, train in enumerate(sorted_trains):
        # Determine which earlier trains in naive order this train was bumped over
        naive_order = sorted(trains, key=lambda t: t.eta_seconds)
        bumped_over = [
            t for t in naive_order
            if t.id != train.id
            and naive_order.index(t) < naive_order.index(train)  # was ahead in naive ETA order
            and train.priority > t.priority  # and we outrank them
            and not any(e.train_id == t.id and e.slot_index < slot_index for e in entries)
            # but we are assigned before them
        ]

        # Detect conflicts with trains that were previously in the schedule
        conflict_with = [
            train_map[e.train_id]
            for e in entries
            if _detect_conflict(train_map[e.train_id], train)
        ]

        # Entry time is max(train's own ETA, next available slot)
        entry_time = max(train.eta_seconds, next_available)
        exit_time = entry_time + SECTION_TRANSIT_SECONDS
        next_available = exit_time  # next train can only enter after this one exits

        reason, conflict_resolved = _build_reason(train, slot_index, bumped_over, conflict_with)

        entries.append(
            ScheduleEntry(
                slot_index=slot_index,
                train_id=train.id,
                train_name=train.name,
                train_type=train.type,
                priority=train.priority,
                eta_seconds=train.eta_seconds,
                entry_time_seconds=entry_time,
                exit_time_seconds=exit_time,
                reason=reason,
                conflict_resolved=conflict_resolved,
            )
        )

    return ScheduleResult(
        section_id="SEC-001",
        computed_at=datetime.now(timezone.utc).isoformat(),
        entries=entries,
        total_trains=len(entries),
    )
