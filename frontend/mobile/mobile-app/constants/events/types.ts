export interface Camera {
  id: number;
  name: string;
  ipAddress: string;
  port: number;
  streamUrl: string;
  location?: string;
}

export interface EventRecordingDto {
  id: number;
  name: string;
  cameraId: number;
  cameraName?: string;
  recordingStart: string;
  recordingEnd: string;
  url?: string;
  videoUrl?: string;
  filePath?: string;
}

export interface ApiResponse<T> {
  isSuccess: boolean;
  message: string;
  data: T;
}

export interface RecordingEvent {
  id: string;
  type: 'recording';
  cameraId: string;
  cameraName: string;
  timestamp: Date;
  duration: number;
  videoUrl: string;
}