// ─── constants/alerts/types.ts ───────────────────────────────────────────────

export interface DetectionItem {
  id:          string;
  name:        string;
  description: string;
  type:        string;
  cameraId:    number;
  cameraName:  string;
  date:        string;
  time:        string;
  severity:    'intrusion' | 'motion' | 'default';
  snapshotUrl: string | null;
  videoUrl:    string | null;
  resolved:    boolean;
  isNew?:      boolean;
}

export interface SensorAlertItem {
  id:             string;
  sensorId:       number;
  sensorName:     string;
  sensorType:     number | string;   // جاي من الـ API
  triggeredValue: number;
  threshold:      number;
  message:        string;
  isResolved:     boolean;
  triggeredAt:    string;            // ISO string
  date:           string;            // formatted
  time:           string;            // formatted
  isNew?:         boolean;
}