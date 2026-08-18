import { useState, useRef } from 'react';
import { useTrains } from './hooks/useTrains';
import { useSchedule } from './hooks/useSchedule';
import { TrainTable } from './components/TrainTable/TrainTable';
import { ScheduleTimeline } from './components/ScheduleTimeline/ScheduleTimeline';
import { ControlPanel } from './components/ControlPanel/ControlPanel';

function App() {
  const { trains, loading, error } = useTrains();
  const {
    schedule,
    status,
    error: scheduleError,
    isOverridden,
    runScheduler,
    applyOverride,
    cancelOverride,
    confirmSchedule,
    reset,
  } = useSchedule();

  const [isOverrideMode, setIsOverrideMode] = useState(false);
  const pendingOverrideIds = useRef<string[]>([]);

  function handleEnterOverride() {
    if (schedule) {
      pendingOverrideIds.current = schedule.entries.map((e) => e.train_id);
      setIsOverrideMode(true);
    }
  }

  function handleCancelOverride() {
    setIsOverrideMode(false);
    cancelOverride();
  }

  async function handleSubmitOverride() {
    setIsOverrideMode(false);
    await applyOverride(pendingOverrideIds.current);
  }

  function handleReset() {
    setIsOverrideMode(false);
    reset();
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header" role="banner">
        <div className="header-inner">
          <div className="header-brand">
            <span className="header-logo" aria-hidden="true">🚆</span>
            <div>
              <h1 className="header-title">Train Traffic Control</h1>
              <p className="header-subtitle">SIH25022 — AI-Powered Section Throughput Optimizer</p>
            </div>
          </div>
          <div className="header-section-info">
            <div className="section-status">
              <span className="section-dot section-dot--active" />
              <span className="section-label">Section: Nagpur–Itarsi Block</span>
            </div>
            <span className="section-cap">Capacity: 1 train</span>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <main className="app-main" id="main-content">
        {/* Left panel: trains */}
        <section className="panel panel--trains" aria-labelledby="trains-heading">
          <div className="panel-header">
            <h2 id="trains-heading" className="panel-title">
              Approaching Trains
              {!loading && (
                <span className="panel-count">{trains.length}</span>
              )}
            </h2>
          </div>
          <TrainTable trains={trains} loading={loading} error={error} />
        </section>

        {/* Right panel: schedule + controls */}
        <section className="panel panel--schedule" aria-labelledby="schedule-heading">
          <div className="panel-header">
            <h2 id="schedule-heading" className="panel-title">
              Passing Schedule
              {schedule && (
                <span className="panel-count">{schedule.total_trains}</span>
              )}
            </h2>
            {schedule && (
              <span className="computed-at">
                Computed {new Date(schedule.computed_at).toLocaleTimeString()}
              </span>
            )}
          </div>

          <ControlPanel
            status={status}
            isOverrideMode={isOverrideMode}
            isOverridden={isOverridden}
            error={scheduleError}
            onRunScheduler={runScheduler}
            onEnterOverride={handleEnterOverride}
            onCancelOverride={handleCancelOverride}
            onSubmitOverride={handleSubmitOverride}
            onConfirm={confirmSchedule}
            onReset={handleReset}
          />

          <ScheduleTimeline
            schedule={schedule}
            isOverrideMode={isOverrideMode}
            onReorder={(ids) => { pendingOverrideIds.current = ids; }}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="app-footer" role="contentinfo">
        <span>SIH 2025 — Problem SIH25022</span>
        <span className="footer-sep">·</span>
        <span>Human-in-the-loop Railway Scheduling</span>
      </footer>
    </div>
  );
}

export default App;
