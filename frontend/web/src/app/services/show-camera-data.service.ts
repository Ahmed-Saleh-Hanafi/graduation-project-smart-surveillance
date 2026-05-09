import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


export interface Camera {
  id?: number;
  name: string;
  ipAddress: string;
  port: number;
  streamUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class ShowCameraDataService {

  private baseUrl = 'http://localhost:5198/api/Camera';

  constructor(private http: HttpClient) {}

  getAll(): Observable<any> {
  return this.http.get<any>(this.baseUrl);
}
}