export interface Camera {
  id: number;
  name: string;
  ipAddress: string;
  port: number;
  streamUrl: string;
}

export interface Face {
  id: string;
  name: string;
  imageUrl: string;
  createdAt: string;
  cameraId: number;
}