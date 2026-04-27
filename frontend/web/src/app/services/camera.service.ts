import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Camera {
  id?: number;
  name: string;
  IpAddress: string;
  port: string;
  username: string;
  password: string;
  path: string;
}

@Injectable({
  providedIn: 'root'
})
export class CameraService {

  private baseUrl = 'http://localhost:5198/api/Camera';

  constructor(private http: HttpClient) {}

  getAll(): Observable<any> {
    return this.http.get(this.baseUrl);
  }

  getById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  create(data: Camera): Observable<any> {
    return this.http.post(this.baseUrl, data);
  }

  update(id: number, data: Camera): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}