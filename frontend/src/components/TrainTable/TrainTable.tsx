import type { Train } from '../../api/types';

const TYPE_CONFIG = {
  express: { label: 'Express', color: 'badge-express', icon: '⚡' },
  passenger: { label: 'Passenger', color: 'badge-passenger', icon: '🧑' },
  freight: { label: 'Freight', color: 'badge-freight', icon: '📦' },
} as const;

function PriorityDots({ priority }: { priority: number }) {
  return (
    <span className="priority-dots" aria-label={`Priority ${priority} of 3`}>
      {[1, 2, 3].map((d) => (
        <span key={d} className={`dot ${d <= priority ? 'dot--active' : 'dot--inactive'}`} />
      ))}
    </span>
  );
}

function formatEta(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

interface TrainTableProps {
  trains: Train[];
  loading: boolean;
  error: string | null;
}

export function TrainTable({ trains, loading, error }: TrainTableProps) {
  if (loading) {
    return (
      <div className="skeleton-container" aria-busy="true" aria-label="Loading trains">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton-row" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state" role="alert">
        <span className="error-icon">⚠</span>
        <p>Failed to load trains: {error}</p>
        <p className="error-hint">Is the backend running? <code>uvicorn main:app --reload</code></p>
      </div>
    );
  }

  if (trains.length === 0) {
    return (
      <div className="empty-state" role="status">
        <span className="empty-icon">🚂</span>
        <p>No trains approaching the section.</p>
      </div>
    );
  }

  const sorted = [...trains].sort((a, b) => a.eta_seconds - b.eta_seconds);

  return (
    <div className="train-table-wrapper">
      <table className="train-table" role="table" aria-label="Approaching trains">
        <thead>
          <tr>
            <th scope="col">Train</th>
            <th scope="col">Type</th>
            <th scope="col">Priority</th>
            <th scope="col">ETA</th>
            <th scope="col">Speed</th>
            <th scope="col">Position</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((train) => {
            const cfg = TYPE_CONFIG[train.type];
            return (
              <tr key={train.id} className="train-row">
                <td className="train-name-cell">
                  <span className="train-id">{train.id}</span>
                  <span className="train-name">{train.name}</span>
                </td>
                <td>
                  <span className={`badge ${cfg.color}`}>
                    <span className="badge-icon" aria-hidden="true">{cfg.icon}</span>
                    {cfg.label}
                  </span>
                </td>
                <td>
                  <PriorityDots priority={train.priority} />
                </td>
                <td>
                  <span className={`eta-value ${train.eta_seconds < 100 ? 'eta--urgent' : ''}`}>
                    {formatEta(train.eta_seconds)}
                  </span>
                </td>
                <td className="data-cell">{train.speed_kmh} km/h</td>
                <td className="data-cell">{train.current_position_km.toFixed(1)} km</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
