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

  // الدالة دي بقت GET زي ما مكتوب عندك في الـ C# بالظبط
  getWebRTCUrl(id: number) {
    return this.http.get<any>(`${this.baseUrl}/${id}/webrtc`);
  }
}