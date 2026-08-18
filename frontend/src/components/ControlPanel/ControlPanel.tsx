import type { ScheduleStatus } from '../../hooks/useSchedule';

const STATUS_CONFIG: Record<ScheduleStatus, { label: string; color: string }> = {
  idle: { label: 'Awaiting Input', color: 'status--idle' },
  loading: { label: 'Computing…', color: 'status--loading' },
  computed: { label: 'Schedule Ready', color: 'status--computed' },
  overriding: { label: 'Applying Override…', color: 'status--loading' },
  confirmed: { label: 'Schedule Confirmed ✓', color: 'status--confirmed' },
  error: { label: 'Error', color: 'status--error' },
};

interface ControlPanelProps {
  status: ScheduleStatus;
  isOverrideMode: boolean;
  isOverridden: boolean;
  error: string | null;
  onRunScheduler: () => void;
  onEnterOverride: () => void;
  onCancelOverride: () => void;
  onSubmitOverride: () => void;
  onConfirm: () => void;
  onReset: () => void;
}

export function ControlPanel({
  status,
  isOverrideMode,
  isOverridden,
  error,
  onRunScheduler,
  onEnterOverride,
  onCancelOverride,
  onSubmitOverride,
  onConfirm,
  onReset,
}: ControlPanelProps) {
  const cfg = STATUS_CONFIG[status];
  const isLoading = status === 'loading' || status === 'overriding';
  const hasSchedule = status === 'computed' || status === 'error';
  const isConfirmed = status === 'confirmed';

  return (
    <div className="control-panel" role="region" aria-label="Controller actions">
      {/* Status badge */}
      <div className={`status-badge ${cfg.color}`}>
        <span className="status-dot" />
        <span className="status-label">{cfg.label}</span>
        {isOverridden && status === 'computed' && (
          <span className="override-tag">Override Active</span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="panel-error" role="alert">
          <span>⚠</span> {error}
        </div>
      )}

      {/* Actions */}
      <div className="panel-actions">
        {!isConfirmed && (
          <button
            id="btn-run-scheduler"
            className="btn btn-primary"
            onClick={onRunScheduler}
            disabled={isLoading}
            aria-label="Run scheduling algorithm"
          >
            {isLoading ? (
              <span className="btn-spinner" aria-hidden="true" />
            ) : (
              <span aria-hidden="true">▶</span>
            )}
            {status === 'idle' ? 'Run Scheduler' : 'Re-run Scheduler'}
          </button>
        )}

        {hasSchedule && !isOverrideMode && !isConfirmed && (
          <>
            <button
              id="btn-accept"
              className="btn btn-success"
              onClick={onConfirm}
              aria-label="Accept computed schedule"
            >
              ✓ Accept Schedule
            </button>
            <button
              id="btn-enter-override"
              className="btn btn-warning"
              onClick={onEnterOverride}
              aria-label="Enter override mode to manually reorder"
            >
              ✎ Override Order
            </button>
          </>
        )}

        {isOverrideMode && (
          <>
            <button
              id="btn-submit-override"
              className="btn btn-success"
              onClick={onSubmitOverride}
              disabled={isLoading}
              aria-label="Submit manual reorder"
            >
              ✓ Submit Override
            </button>
            <button
              id="btn-cancel-override"
              className="btn btn-ghost"
              onClick={onCancelOverride}
              disabled={isLoading}
              aria-label="Cancel override, revert to AI schedule"
            >
              ✕ Cancel Override
            </button>
          </>
        )}

        {isConfirmed && (
          <button
            id="btn-reset"
            className="btn btn-ghost"
            onClick={onReset}
            aria-label="Reset and start over"
          >
            ↺ Reset
          </button>
        )}
      </div>

      {/* Override hint */}
      {isOverrideMode && (
        <p className="override-hint" role="status">
          Use ▲ ▼ buttons on the timeline cards to reorder, then click "Submit Override".
        </p>
      )}
    </div>
  );
}
