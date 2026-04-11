export type BmsEventType = "lifecycle" | "metric" | "error" | "info" | "warning";

export type ConnectionStatus = "online" | "offline" | "degraded";

/** Raw technical state of the RootPlanner host — shown as "Tags" in each post */
export interface RootPlannerState {
  cpu: number; // 0-100
  battery: number; // 0-100
  connection: ConnectionStatus;
  timestamp: number;
  /** Arbitrary RootPlanner variables forwarded as-is */
  [key: string]: unknown;
}

/** A single BMS lifecycle event — rendered as one "post" in the feed */
export interface BmsEvent {
  id: string;
  timestamp: number;
  type: BmsEventType;
  /** Caption: the raw BMS log message */
  message: string;
  /** Whether to render the Unity WebGL viewport or a live SVG metrics graph */
  mediaType: "graph" | "unity";
  /** Snapshot of RootPlanner state at event time */
  state: RootPlannerState;
  /** CPU readings for the last N events (used to render the SVG sparkline) */
  cpuHistory: number[];
  /** Battery readings for the last N events */
  batteryHistory: number[];
}

/** Shape of the JSON body accepted by POST /api/bms/push */
export interface BmsPushPayload {
  type: BmsEventType;
  message: string;
  state: RootPlannerState;
  mediaType?: "graph" | "unity";
}
