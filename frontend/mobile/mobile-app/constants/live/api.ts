// ─── API Config ───────────────────────────────────────────────────────────────

export const BASE_URL    = 'http://192.168.1.2:5198';
export const GO2RTC_HOST = '192.168.1.2';
export const GO2RTC_PORT = 1984;

// ─── Global events store ──────────────────────────────────────────────────────
import type { EventRecording } from './types';

let _eventsStore: EventRecording[] = [];
export const getEvents      = () => _eventsStore;
export const setEventsStore = (e: EventRecording[]) => { _eventsStore = e; };

// ─── Fetch utility ────────────────────────────────────────────────────────────
export const fetchWithTimeout = (
  url: string,
  options: RequestInit = {},
  ms = 5000,
): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
};