import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UserCameraService {

  private baseUrl = 'http://localhost:5198/api/UserCamera';

  constructor(private http: HttpClient) {}

  getUserCameras(userId: string | number) {
    return this.http.get(`${this.baseUrl}/user/${userId}/cameras`);
  }

  add(userId: string | number, cameraId: number) {
    return this.http.post(
      `${this.baseUrl}/user/${userId}/camera/${cameraId}`,
      {}
    );
  }

  remove(userId: string | number, cameraId: number) {
    return this.http.delete(
      `${this.baseUrl}/user/${userId}/camera/${cameraId}`
    );
  }
}