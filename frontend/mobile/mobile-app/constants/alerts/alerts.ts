// ─── constants/alerts/alerts.ts ──────────────────────────────────────────────

export const BASE_URL = 'http://192.168.1.2:5198';
export const HUB_URL  = `${BASE_URL}/hub/alerts`;

// ── Detection severity map ────────────────────────────────────────────────────
export const SEV: Record<string, { color: string; label: string; icon: any }> = {
  intrusion: { color: '#FF3B30', label: 'Intrusion', icon: 'warning'  },
  motion:    { color: '#FF9500', label: 'Motion',    icon: 'walk'     },
  default:   { color: '#378ADD', label: 'Detection', icon: 'camera'   },
};

// ── Sensor type → display map ─────────────────────────────────────────────────
export const SENSOR_TYPE_MAP: Record<number, { label: string; icon: any; color: string }> = {
  1: { label: 'Temperature', icon: 'thermometer',  color: '#FF9500' },
  2: { label: 'Gas / Smoke', icon: 'flame',        color: '#FF3B30' },
  3: { label: 'Motion',      icon: 'walk',         color: '#FF6B35' },
  4: { label: 'Sound',       icon: 'volume-high',  color: '#AF52DE' },
};

export const getSensorTypeDisplay = (sensorType: number | string) => {
  const t = typeof sensorType === 'string'
    ? Object.entries(SENSOR_TYPE_MAP).find(([, v]) => v.label.toLowerCase() === sensorType.toLowerCase())?.[0]
    : sensorType;
  return SENSOR_TYPE_MAP[Number(t)] ?? { label: String(sensorType), icon: 'hardware-chip-outline', color: '#007AFF' };
};

// ── Tabs ──────────────────────────────────────────────────────────────────────
export const TABS         = ['All', 'Not Resolved', 'Resolved'] as const;
export const SENSOR_TABS  = ['All', 'Not Resolved', 'Resolved'] as const;
export const SCREEN_TABS  = ['Detections', 'Sensor Alerts']     as const;