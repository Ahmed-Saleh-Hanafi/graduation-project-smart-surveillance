// ─── Types ────────────────────────────────────────────────────────────────────

export type CameraStatus = 'LIVE' | 'IDLE';

export type Camera = {
  id: number;
  name: string;
  ipAddress: string;
  port: number;
  streamUrl: string;
  status?: CameraStatus;
  location?: string;
  res?: string;
  webRTCUrl?: string;
};

export type SensorKey = string;

export type Sensor = {
  key: SensorKey;
  sensorType: number;
  sensorName: string;
  icon: string;
  label: string;
  value: number;
  unit: string;
  status: string;
  statusColor: string;
  bg: string;
  color: string;
  max: number;
  history: number[];
  description: string;
  thresholds: { safe: number; warn: number };
  apiThreshold: number;
  apiId?: number;
  isActive?: boolean;
};

export type EventRecording = {
  id: number;
  name: string;
  cameraId: number;
  cameraName?: string;
  recordingStart: string;
  recordingEnd?: string;
  videoUrl?: string;
};

export type Detection = {
  id: string;
  name: string;
  confidence: number;
  bbox: { x: number; y: number; w: number; h: number };
  isBlocked: boolean;
};


export type ActiveSheet = 'info' | 'options' | 'fullscreen' | null;