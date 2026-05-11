import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id?: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  userName: string;
}

export interface UpdateUserDto {
  Id: string;
  Email: string;
  UserName: string;
  FirstName: string;
  LastName: string;
  password?: string;
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

  update(data: UpdateUserDto): Observable<any> {
    return this.http.put(`${this.baseUrl}/update-user`, data);
  }

  delete(id: string | number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/delete-user`, { params: { id: String(id) } });
  }
}