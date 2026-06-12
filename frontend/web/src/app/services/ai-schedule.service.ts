import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// ─── Response shapes (camelCase — .NET 10 System.Text.Json default) ───────────

export interface AiScheduleInterval {
  id: number;
  startTime: string;   // "HH:mm:ss" e.g. "08:00:00"
  endTime: string;     // "HH:mm:ss"
}

export interface AiSchedule {
  id: number;
  cameraId: number;
  cameraName: string;
  modelName: string;          // "face" | "abnormal" | "weapon"
  dayOfWeek: number | null;   // null = every day, 0=Sun … 6=Sat
  dayOfWeekName: string;      // "Every Day" | "Monday" | etc.
  isActive: boolean;
  intervals: AiScheduleInterval[];
}

export interface ApiResponse<T> {
  isSuccess: boolean;
  message: string;
  data: T;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AiScheduleService {
  private readonly base = 'http://localhost:5198/api/AISchedule';

  constructor(private http: HttpClient) {}

  /** GET /api/AISchedule */
  getAll(): Observable<ApiResponse<AiSchedule[]>> {
    return this.http.get<ApiResponse<AiSchedule[]>>(this.base);
  }

  /** GET /api/AISchedule/camera/{cameraId} */
  getByCameraId(cameraId: number): Observable<ApiResponse<AiSchedule[]>> {
    return this.http.get<ApiResponse<AiSchedule[]>>(`${this.base}/camera/${cameraId}`);
  }

  /**
   * POST /api/AISchedule
   * If a schedule for the same camera+model+day already exists,
   * the backend ADDS the intervals to that schedule (no duplicate created).
   */
  create(dto: {
    cameraId: number;
    modelName: string;
    dayOfWeek: number | null;
    intervals: { startTime: string; endTime: string }[];
  }): Observable<ApiResponse<AiSchedule>> {
    return this.http.post<ApiResponse<AiSchedule>>(this.base, dto);
  }

  /** DELETE /api/AISchedule/Schedule/{id} */
  deleteSchedule(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.base}/Schedule/${id}`);
  }

  /** DELETE /api/AISchedule/Interval/{intervalId} */
  deleteInterval(intervalId: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.base}/Interval/${intervalId}`);
  }

  /** PATCH /api/AISchedule/{id}/toggle?isActive=true|false */
  toggle(id: number, isActive: boolean): Observable<ApiResponse<boolean>> {
    return this.http.patch<ApiResponse<boolean>>(
      `${this.base}/${id}/toggle?isActive=${isActive}`,
      {}
    );
  }

  /** PUT /api/AISchedule — full update */
  update(dto: AiSchedule): Observable<ApiResponse<boolean>> {
    return this.http.put<ApiResponse<boolean>>(this.base, dto);
  }
}