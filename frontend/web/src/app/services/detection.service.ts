import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Detection {
  id: number;
  name: string;
  description: string;
  type: string;
  videoUrl?: string;
  cameraId: number;
  detectedAt: string;
  snapShotUrl?: string;
  isResolved?: boolean; // ضفنا الأتريبيوت هنا عشان الـ TypeScript ميعملش إيرور
}

@Injectable({
  providedIn: 'root'
})
export class DetectionService {

  private baseUrl = 'http://localhost:5198/api/Detection';

  constructor(private http: HttpClient) {}

  getAll(): Observable<any> {
    return this.http.get(this.baseUrl);
  }

  getByCamera(cameraId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/camera/${cameraId}`);
  }

  getByDay(date: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/day/${date}`);
  }

  // التعديل هنا: استخدام POST زي ما موجود في الـ Swagger عندك
  markAsResolved(detectionId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/${detectionId}/resolve`, {});
  }
}