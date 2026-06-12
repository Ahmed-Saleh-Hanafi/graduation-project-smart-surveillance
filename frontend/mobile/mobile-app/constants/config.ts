// ─── constants/config.ts ──────────────────────────────────────────────────────
// ⚠️  SINGLE SOURCE OF TRUTH for the backend server address.
//     Change SERVER_IP here whenever your machine's local IP changes,
//     and it will propagate to every screen/hook in the app automatically.

export const SERVER_IP   = '192.168.1.2';
export const SERVER_PORT = 5198;

export const BASE_URL    = `http://${SERVER_IP}:${SERVER_PORT}`;
export const GO2RTC_HOST = SERVER_IP;
export const GO2RTC_PORT = 1984;
