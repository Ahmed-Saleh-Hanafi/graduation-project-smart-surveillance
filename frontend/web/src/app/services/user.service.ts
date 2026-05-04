import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id?: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userName: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private baseUrl = 'http://localhost:5198/api/UserManagement';

  constructor(private http: HttpClient) {}

  getAll(): Observable<any> {
    return this.http.get(`${this.baseUrl}/get-all-users`);
  }

  create(data: User): Observable<any> {
    return this.http.post(`${this.baseUrl}/create-user`, data);
  }
}