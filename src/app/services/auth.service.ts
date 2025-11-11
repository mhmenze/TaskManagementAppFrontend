import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '../models/auth.model';
import { ApiResponse } from '../models/api-response.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<LoginResponse | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.checkCurrentUser();
  }

  login(request: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/login`, request, { withCredentials: true })
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.currentUserSubject.next(response.data);
            localStorage.setItem('currentUser', JSON.stringify(response.data));
          }
        })
      );
  }

  register(request: RegisterRequest): Observable<ApiResponse<RegisterResponse>> {
    return this.http.post<ApiResponse<RegisterResponse>>(`${this.apiUrl}/register`, request, { withCredentials: true });
  }

  logout(): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/logout`, {}, { withCredentials: true })
      .pipe(
        tap(() => {
          this.currentUserSubject.next(null);
          localStorage.removeItem('currentUser');
        })
      );
  }

  checkCurrentUser(): void {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      this.currentUserSubject.next(JSON.parse(stored));
    }

    this.http.get<ApiResponse<LoginResponse>>(`${this.apiUrl}/current-user`, { withCredentials: true })
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.currentUserSubject.next(response.data);
            localStorage.setItem('currentUser', JSON.stringify(response.data));
          }
        },
        error: () => {
          this.currentUserSubject.next(null);
          localStorage.removeItem('currentUser');
        }
      });
  }


  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getCurrentUser(): LoginResponse | null {
    return this.currentUserSubject.value;
  }

  updateCurrentUser(userData: any): void {
  // Update the stored user data in sessionStorage/localStorage
  const currentUser = this.getCurrentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
      // or if you're using localStorage:
      // localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
  }
}