import { useState } from 'react';
import type { ScheduleResult, ScheduleEntry } from '../../api/types';

const TYPE_ICONS: Record<string, string> = {
  express: '⚡',
  passenger: '🧑',
  freight: '📦',
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `T+${s}s`;
  return s > 0 ? `T+${m}m ${s}s` : `T+${m}m`;
}

interface SlotCardProps {
  entry: ScheduleEntry;
  index: number;
  total: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isOverrideMode: boolean;
}

function SlotCard({
  entry,
  index,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  isOverrideMode,
}: SlotCardProps) {
  return (
    <div
      className={`slot-card slot-card--${entry.train_type} ${entry.conflict_resolved ? 'slot-card--conflict' : ''}`}
      aria-label={`Slot ${index + 1}: ${entry.train_name}`}
    >
      <div className="slot-number" aria-hidden="true">{index + 1}</div>

      <div className="slot-info">
        <div className="slot-header">
          <span className="slot-icon" aria-hidden="true">{TYPE_ICONS[entry.train_type]}</span>
          <span className="slot-train-name">{entry.train_name}</span>
          <span className={`slot-badge badge-${entry.train_type}`}>{entry.train_type}</span>
          {entry.conflict_resolved && (
            <span className="conflict-tag" title="Conflict resolved by scheduler">
              ✓ Conflict resolved
            </span>
          )}
        </div>

        <div className="slot-times">
          <span className="slot-time-label">Entry</span>
          <span className="slot-time-value">{formatTime(entry.entry_time_seconds)}</span>
          <span className="slot-time-sep">→</span>
          <span className="slot-time-label">Exit</span>
          <span className="slot-time-value">{formatTime(entry.exit_time_seconds)}</span>
        </div>

        <p className="slot-reason">{entry.reason}</p>
      </div>

      {isOverrideMode && (
        <div className="slot-controls" role="group" aria-label={`Reorder ${entry.train_name}`}>
          <button
            className="reorder-btn"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            aria-label={`Move ${entry.train_name} up`}
            title="Move up"
          >
            ▲
          </button>
          <button
            className="reorder-btn"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            aria-label={`Move ${entry.train_name} down`}
            title="Move down"
          >
            ▼
          </button>
        </div>
      )}
    </div>
  );
}

interface ScheduleTimelineProps {
  schedule: ScheduleResult | null;
  isOverrideMode: boolean;
  onReorder: (orderedIds: string[]) => void;
}

export function ScheduleTimeline({
  schedule,
  isOverrideMode,
  onReorder,
}: ScheduleTimelineProps) {
  const [localEntries, setLocalEntries] = useState<ScheduleEntry[] | null>(null);

  // Sync local order when schedule updates (but only if not actively reordering)
  const entries = isOverrideMode && localEntries != null
    ? localEntries
    : schedule?.entries ?? null;

  function syncLocal(current: ScheduleEntry[]) {
    setLocalEntries(current);
    onReorder(current.map((e) => e.train_id));
  }

  function moveEntry(from: number, to: number) {
    if (!entries) return;
    const next = [...entries];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    syncLocal(next);
  }

  if (!schedule) {
    return (
      <div className="timeline-empty" role="status">
        <div className="timeline-empty-icon" aria-hidden="true">🛤</div>
        <p className="timeline-empty-title">No schedule computed yet</p>
        <p className="timeline-empty-hint">Click "Run Scheduler" to compute the passing order.</p>
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="timeline-empty" role="status">
        <p>No trains to schedule.</p>
      </div>
    );
  }

  return (
    <div className="timeline" aria-label="Computed schedule timeline">
      <div className="timeline-track" aria-hidden="true" />
      {entries.map((entry, i) => (
        <SlotCard
          key={entry.train_id}
          entry={entry}
          index={i}
          total={entries.length}
          canMoveUp={i > 0}
          canMoveDown={i < entries.length - 1}
          onMoveUp={() => moveEntry(i, i - 1)}
          onMoveDown={() => moveEntry(i, i + 1)}
          isOverrideMode={isOverrideMode}
        />
      ))}
    </div>
  );
}
