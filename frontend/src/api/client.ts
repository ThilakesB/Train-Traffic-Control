import type {
  Train,
  TrainCreate,
  ScheduleResult,
  OverrideRequest,
  ConfirmResponse,
} from './types';

const BASE_URL = 'http://localhost:8000';

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Trains
  listTrains: () => request<Train[]>('/trains'),
  addTrain: (payload: TrainCreate) =>
    request<Train>('/trains', { method: 'POST', body: JSON.stringify(payload) }),

  // Schedule
  getSchedule: () => request<ScheduleResult>('/schedule'),
  overrideSchedule: (payload: OverrideRequest) =>
    request<ScheduleResult>('/schedule/override', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  cancelOverride: () =>
    request<{ status: string; message: string }>('/schedule/override', {
      method: 'DELETE',
    }),
  confirmSchedule: () =>
    request<ConfirmResponse>('/schedule/confirm', { method: 'POST' }),
};
