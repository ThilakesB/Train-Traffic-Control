// TypeScript interfaces mirroring backend Pydantic models

export type TrainType = 'express' | 'passenger' | 'freight';

export interface Train {
  id: string;
  name: string;
  type: TrainType;
  priority: number;
  eta_seconds: number;
  speed_kmh: number;
  current_position_km: number;
}

export interface TrainCreate {
  name: string;
  type: TrainType;
  eta_seconds: number;
  speed_kmh?: number;
  current_position_km?: number;
}

export interface ScheduleEntry {
  slot_index: number;
  train_id: string;
  train_name: string;
  train_type: TrainType;
  priority: number;
  eta_seconds: number;
  entry_time_seconds: number;
  exit_time_seconds: number;
  reason: string;
  conflict_resolved: boolean;
}

export interface ScheduleResult {
  section_id: string;
  computed_at: string;
  entries: ScheduleEntry[];
  total_trains: number;
}

export interface OverrideRequest {
  ordered_train_ids: string[];
}

export interface ConfirmResponse {
  status: string;
  source: string;
  message: string;
}
