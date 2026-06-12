// ─── Sensor UI Map ────────────────────────────────────────────────────────────
import type { Sensor } from './types';

export const SENSOR_UI: Record<number, {
  icon: string; label: string; unit: string;
  bg: string; color: string; max: number; description: string;
}> = {
  1: {
    icon: 'thermometer', label: 'Temperature', unit: '°C',
    bg: '#FFF3E0', color: '#FF9500', max: 50,
    description: 'DHT22 measures ambient temperature. Optimal range 18–26°C.',
  },
  2: {
    icon: 'smoke-detector', label: 'Gas / Smoke', unit: 'PPM',
    bg: '#E8F5E9', color: '#34C759', max: 500,
    description: 'MQ-2 detects gas leaks and smoke. Above threshold triggers an alert.',
  },
  3: {
    icon: 'motion-sensor', label: 'Motion (PIR)', unit: 'events',
    bg: '#E8F5E9', color: '#34C759', max: 20,
    description: 'PIR sensor detects movement. Spikes may indicate intrusion.',
  },
  4: {
    icon: 'volume-high', label: 'Sound Level', unit: 'dB',
    bg: '#EDE7F6', color: '#AF52DE', max: 120,
    description: 'Sound sensor measures ambient noise. Above threshold triggers an alert.',
  },
};

// ─── Sensor Utilities ─────────────────────────────────────────────────────────

export const getSensorUI = (sensorType: number, sensorName: string) =>
  SENSOR_UI[sensorType] ?? {
    icon: 'chip',
    label: sensorName,
    unit: '',
    bg: '#EEF2FF',
    color: '#007AFF',
    max: 100,
    description: `Sensor: ${sensorName}`,
  };

export const deriveSensorStatus = (
  sensorType: number,
  value: number,
  thresholds: { safe: number; warn: number },
): { status: string; statusColor: string } => {
  const isTemp   = sensorType === 1;
  const isGas    = sensorType === 2;
  const isMotion = sensorType === 3;
  const isSound  = sensorType === 4;

  let danger  = 'Critical';
  let warning = 'Warning';
  let safe    = 'Normal';
  let safeColor = '#34C759';

  if (isTemp)   { danger = 'Critical'; warning = 'High';    safe = 'Stable'; safeColor = '#FF9500'; }
  if (isGas)    { danger = 'Danger!';  warning = 'Warning'; safe = 'Normal'; safeColor = '#34C759'; }
  if (isMotion) { danger = 'Alert!';   warning = 'Active';  safe = 'Clear';  safeColor = '#34C759'; }
  if (isSound)  { danger = 'Loud!';    warning = 'Noisy';   safe = 'Quiet';  safeColor = '#34C759'; }

  if (value > thresholds.warn) return { status: danger,  statusColor: '#FF3B30' };
  if (value > thresholds.safe) return { status: warning, statusColor: '#FF9500' };
  return { status: safe, statusColor: safeColor };
};

export const buildSensorFromApi = (apiSensor: any): Sensor => {
  const ui         = getSensorUI(apiSensor.sensorType, apiSensor.sensorName);
  const apiThresh  = typeof apiSensor.threshold === 'number' && isFinite(apiSensor.threshold)
    ? apiSensor.threshold : 100;
  const thresholds = { safe: apiThresh * 0.6, warn: apiThresh };
  const value      = 0;
  const { status, statusColor } = deriveSensorStatus(apiSensor.sensorType, value, thresholds);

  return {
    key:          `${ui.label.toLowerCase().replace(/\s+/g, '_')}_${apiSensor.id}`,
    sensorType:   apiSensor.sensorType,
    sensorName:   apiSensor.sensorName,
    icon:         ui.icon,
    label:        apiSensor.sensorName,
    value,
    unit:         ui.unit,
    status,
    statusColor,
    bg:           ui.bg,
    color:        ui.color,
    max:          Math.max(ui.max, apiThresh * 1.5),
    history:      [0, 0, 0, 0, 0, 0],
    description:  `${ui.description}\nAlert threshold: ${apiThresh} ${ui.unit}`,
    thresholds,
    apiThreshold: apiThresh,
    apiId:        apiSensor.id,
    isActive:     apiSensor.isActive,
  };
};