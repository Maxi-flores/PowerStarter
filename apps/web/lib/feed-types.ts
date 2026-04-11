export type VisualTheme = "normal" | "warning" | "fault" | "charging" | "idle";

export interface VisualState {
  theme: VisualTheme;
  label: string;
}

export interface TechnicalMetrics {
  /** Human-readable operating state, e.g. "Discharging", "Charging", "Fault" */
  state: string;
  /** Pack voltage in volts */
  voltage: number;
  /** State of charge 0–100 */
  soc?: number;
  /** Pack current in amps (positive = charging) */
  current?: number;
  /** Cell count */
  cellCount?: number;
}

export interface VisualStateRecord {
  id: string;
  timestamp: string; // ISO-8601
  visualState: VisualState;
  technicalMetrics: TechnicalMetrics;
}

/** Shape of the /api/feed GET response */
export interface FeedResponse {
  records: VisualStateRecord[];
  totalProcessed: number;
  plannerActive: boolean;
}
