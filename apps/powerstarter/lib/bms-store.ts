import { randomUUID } from "crypto";
import type { BmsEvent, BmsPushPayload, RootPlannerState } from "./bms-types";

const MAX_EVENTS = 50;
const METRICS_WINDOW = 20;

interface BmsStore {
  events: BmsEvent[];
  cpuHistory: number[];
  batteryHistory: number[];
  latestState: RootPlannerState | null;
  listeners: Set<(event: BmsEvent) => void>;
}

declare global {
  // `var` is required here so that TypeScript merges this declaration with the
  // Node.js global object (using `let`/`const` inside a `declare global` block
  // is not allowed and would not attach to `global` at runtime).
  // eslint-disable-next-line no-var
  var __bmsStore: BmsStore | undefined;
}

function getStore(): BmsStore {
  if (!global.__bmsStore) {
    global.__bmsStore = {
      events: [],
      cpuHistory: [],
      batteryHistory: [],
      latestState: null,
      listeners: new Set(),
    };
  }
  return global.__bmsStore;
}

/** Push a new BMS event into the store and notify all SSE listeners. */
export function pushBmsEvent(payload: BmsPushPayload): BmsEvent {
  const store = getStore();

  store.cpuHistory = [
    ...store.cpuHistory.slice(-(METRICS_WINDOW - 1)),
    payload.state.cpu ?? 0,
  ];
  store.batteryHistory = [
    ...store.batteryHistory.slice(-(METRICS_WINDOW - 1)),
    payload.state.battery ?? 100,
  ];  store.latestState = { ...payload.state, timestamp: Date.now() };

  const event: BmsEvent = {
    id: randomUUID(),
    timestamp: Date.now(),
    type: payload.type,
    message: payload.message,
    mediaType: payload.mediaType ?? "graph",
    state: store.latestState,
    cpuHistory: [...store.cpuHistory],
    batteryHistory: [...store.batteryHistory],
  };

  store.events = [event, ...store.events.slice(0, MAX_EVENTS - 1)];
  store.listeners.forEach((fn) => fn(event));

  return event;
}

/** Return all stored events (newest first). */
export function getBmsEvents(): BmsEvent[] {
  return getStore().events;
}

/** Return the latest RootPlanner state, or null if no event has been pushed. */
export function getLatestState(): RootPlannerState | null {
  return getStore().latestState;
}

/** Subscribe to new events. Returns an unsubscribe function. */
export function subscribeBms(fn: (event: BmsEvent) => void): () => void {
  const store = getStore();
  store.listeners.add(fn);
  return () => store.listeners.delete(fn);
}
