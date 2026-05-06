import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private baseUrl = 'http://localhost:5198/api/Camera';

  constructor(private http: HttpClient) {}

  getCameras() {
    return this.http.get<any>(this.baseUrl);
  }

  startStream(id: number, offer: RTCSessionDescriptionInit) {
    return this.http.post<RTCSessionDescriptionInit>(
      `${this.baseUrl}/${id}/webrtc`,
      offer
    ).toPromise();
  }
}