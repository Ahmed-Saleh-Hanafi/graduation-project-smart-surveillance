import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AiScheduleInterval {
  id: number;
  startTime: string;
  endTime: string;
}

export interface AiSchedule {
  id: number;
  cameraId: number;
  cameraName: string;
  modelName: string;
  dayOfWeek: number | null;
  dayLabel: string;
  isActive: boolean;
  createdAt: string;
  intervals: AiScheduleInterval[];
}

export interface ApiResponse<T> {
  isSuccess: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class AiScheduleService {
  private base = 'http://localhost:5198/api/ai-schedule';

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<AiSchedule[]>> {
    return this.http.get<ApiResponse<AiSchedule[]>>(this.base);
  }

  create(dto: any): Observable<ApiResponse<AiSchedule>> {
    return this.http.post<ApiResponse<AiSchedule>>(this.base, dto);
  }

  delete(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.base}/${id}`);
  }

  toggle(id: number, isActive: boolean): Observable<ApiResponse<boolean>> {
    return this.http.patch<ApiResponse<boolean>>(`${this.base}/${id}/toggle?isActive=${isActive}`, {});
  }

  getActiveNow(cameraId?: number): Observable<ApiResponse<AiSchedule[]>> {
    const params = cameraId ? `?cameraId=${cameraId}` : '';
    return this.http.get<ApiResponse<AiSchedule[]>>(`${this.base}/active${params}`);
  }
}