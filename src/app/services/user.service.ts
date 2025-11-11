import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';

export interface CreateUserRequest {
  firstName: string;
  middleName?: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
}

export interface UpdateUserRequest {
  firstName: string;
  middleName?: string;
  lastName: string;
  username: string;
  email: string;
  password?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/user`;

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(this.apiUrl, { withCredentials: true });
  }

  getUserById(userId: number): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/${userId}`, { withCredentials: true });
  }

  createUser(request: CreateUserRequest): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.apiUrl}/register`, request);
  }

  updateUser(userId: number, request: UpdateUserRequest): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/${userId}`, request);
  }

  deleteUser(userId: number, softDelete: boolean = true): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${userId}?softDelete=${softDelete}`);
  }
}