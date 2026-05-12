import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Camera {
  id?: number;
  name: string;
  ipAddress: string;
  port: number;
  username: string;
  password: string;
  path: string;
  
}
export interface CameraView {
  id: number;
  name: string;
  ipAddress: string;
  port: number;
  streamUrl: string;
}

@Injectable({
  providedIn: 'root'
})

export class CameraService {

  private baseUrl = 'http://localhost:5198/api/Camera';
  private Url = 'http://localhost:5198/api/Camera/byid/{id}';

  constructor(private http: HttpClient) {}

  getAll(): Observable<any> {
  return this.http.get<any>(this.baseUrl);
}

  getById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`);
  }
  lol(id: number): Observable<any> {
  return this.http.get(`http://localhost:5198/api/Camera/byid/${id}`);
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