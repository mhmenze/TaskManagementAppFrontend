import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { UserTask, TaskStatus } from '../models/task.model';
import { CreateTaskRequest, UpdateTaskRequest, TaskFilterRequest } from '../models/task-request.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = `${environment.apiUrl}/task`;

  constructor(private http: HttpClient) { }

  getAllTasks(filter?: TaskFilterRequest): Observable<ApiResponse<UserTask[]>> {
    let params = new HttpParams();
    
    if (filter) {
      if (filter.status !== undefined) params = params.set('status', filter.status.toString());
      if (filter.assignedUserID) params = params.set('assignedUserID', filter.assignedUserID.toString());
      if (filter.isDelayed !== undefined) params = params.set('isDelayed', filter.isDelayed.toString());
      if (filter.searchTerm) params = params.set('searchTerm', filter.searchTerm);
      if (filter.sortBy) params = params.set('sortBy', filter.sortBy);
      if (filter.sortDescending !== undefined) params = params.set('sortDescending', filter.sortDescending.toString());
    }

    return this.http.get<ApiResponse<UserTask[]>>(this.apiUrl, { params, withCredentials: true });
  }

  getTasksByUserId(userId: number): Observable<ApiResponse<UserTask[]>> {
    return this.http.get<ApiResponse<UserTask[]>>(`${this.apiUrl}/user/${userId}`, { withCredentials: true });
  }

  getTaskById(taskId: number): Observable<ApiResponse<UserTask>> {
    return this.http.get<ApiResponse<UserTask>>(`${this.apiUrl}/${taskId}`, { withCredentials: true });
  }

  createTask(request: CreateTaskRequest): Observable<ApiResponse<UserTask>> {
    return this.http.post<ApiResponse<UserTask>>(this.apiUrl, request, { withCredentials: true });
  }

  updateTask(taskId: number, request: UpdateTaskRequest): Observable<ApiResponse<UserTask>> {
    return this.http.put<ApiResponse<UserTask>>(`${this.apiUrl}/${taskId}`, request, { withCredentials: true });
  }

  deleteTask(taskId: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${taskId}`, { withCredentials: true });
  }

  updateTaskStatus(taskId: number, status: TaskStatus): Observable<ApiResponse<UserTask>> {
    return this.http.patch<ApiResponse<UserTask>>(`${this.apiUrl}/${taskId}/status`, status, { withCredentials: true });
  }
}