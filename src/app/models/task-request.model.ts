import { TaskStatus } from './task.model';

export interface CreateTaskRequest {
  taskName: string;
  taskDescription?: string;
  assignedUserIDs?: number[];
  deadline?: Date;
}

export interface UpdateTaskRequest {
  taskName: string;
  taskDescription?: string;
  assignedUserIDs?: number[];
  status: TaskStatus;
  deadline?: Date;
}

export interface TaskFilterRequest {
  status?: TaskStatus;
  assignedUserID?: number;
  isDelayed?: boolean;
  searchTerm?: string;
  sortBy?: string;
  sortDescending?: boolean;
}

export interface TaskCurrentStatus {
  currentStatus: TaskStatus;
}