import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private baseUrl = 'http://localhost:5198/api/Camera';

  constructor(private http: HttpClient) {}

  // تجيب كل الكاميرات
  getCameras(): Observable<any> {
    return this.http.get(this.baseUrl);
  }

  // تجيب فيديو كاميرا معينة
  getCameraStream(id: number): string {
    return `${this.baseUrl}/${id}/webrtc`;
  }
}