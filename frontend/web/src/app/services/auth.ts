import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:5198/api/Account/login'; // غير اللينك ده

  constructor(private http: HttpClient) {}

  login(data: { email: string; password: string }) {
  return this.http.post(this.apiUrl, data);
  
}
}