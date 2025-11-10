export interface UserTask {
  taskID: number;
  taskName: string;
  taskDescription?: string;
  assignedUserIDs?: number[];
  status: TaskStatus;
  isDelayed: boolean;
  deadline?: Date;
  createdOn: Date;
  createdBy?: string;
  updatedOn: Date;
  updatedBy?: string;
}

export enum TaskStatus {
  ToDo = 0,
  InProgress = 1,
  Completed = 2,
  UnAssigned = 3,
  Deleted = 4
}