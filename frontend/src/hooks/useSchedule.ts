import { useState, useCallback } from 'react';
import { api } from '../api/client';
import type { ScheduleResult } from '../api/types';

export type ScheduleStatus = 'idle' | 'loading' | 'computed' | 'overriding' | 'confirmed' | 'error';

export function useSchedule() {
  const [schedule, setSchedule] = useState<ScheduleResult | null>(null);
  const [status, setStatus] = useState<ScheduleStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isOverridden, setIsOverridden] = useState(false);

  const runScheduler = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const result = await api.getSchedule();
      setSchedule(result);
      setIsOverridden(false);
      setStatus('computed');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scheduler failed');
      setStatus('error');
    }
  }, []);

  const applyOverride = useCallback(async (orderedIds: string[]) => {
    setStatus('overriding');
    setError(null);
    try {
      const result = await api.overrideSchedule({ ordered_train_ids: orderedIds });
      setSchedule(result);
      setIsOverridden(true);
      setStatus('computed');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Override failed');
      setStatus('error');
    }
  }, []);

  const cancelOverride = useCallback(async () => {
    try {
      await api.cancelOverride();
      setIsOverridden(false);
      // Re-run scheduler to get fresh AI result
      await runScheduler();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cancel override failed');
    }
  }, [runScheduler]);

  const confirmSchedule = useCallback(async () => {
    setStatus('loading');
    try {
      await api.confirmSchedule();
      setStatus('confirmed');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Confirm failed');
      setStatus('error');
    }
  }, []);

  const reset = useCallback(() => {
    setSchedule(null);
    setStatus('idle');
    setError(null);
    setIsOverridden(false);
  }, []);

  return {
    schedule,
    status,
    error,
    isOverridden,
    runScheduler,
    applyOverride,
    cancelOverride,
    confirmSchedule,
    reset,
  };
}
