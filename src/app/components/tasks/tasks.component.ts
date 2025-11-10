import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { UserTask, TaskStatus } from '../../models/task.model';
import { User } from '../../models/user.model';
import { TaskFilterRequest } from '../../models/task-request.model';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css']
})

export class TasksComponent implements OnInit {
  tasks: UserTask[] = [];
  filteredTasks: UserTask[] = [];
  users: User[] = [];
  
  taskForm!: FormGroup;
  isEditMode = false;
  selectedTaskId?: number;
  
  // Filter properties
  filterStatus?: TaskStatus;
  filterSearch = '';
  sortBy = 'created';
  sortDescending = true;
  
  TaskStatus = TaskStatus;
  loading = false;
  errorMessage = '';
  successMessage = '';
  
  currentUser: any;

  constructor(
    private formBuilder: FormBuilder,
    private taskService: TaskService,
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    this.taskForm = this.formBuilder.group({
      taskName: ['', Validators.required],
      taskDescription: [''],
      assignedUserIDs: [[]],
      deadline: [''],
      status: [TaskStatus.ToDo]
    });

    this.loadUsers();
    this.loadTasks();
  }

  loadUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.users = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading users:', error);
      }
    });
  }

  loadTasks(): void {
    this.loading = true;
    const filter: TaskFilterRequest = {
      status: this.filterStatus,
      searchTerm: this.filterSearch || undefined,
      sortBy: this.sortBy,
      sortDescending: this.sortDescending
    };

    this.taskService.getAllTasks(filter).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success && response.data) {
          this.tasks = response.data;
          this.filteredTasks = this.tasks;
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = 'Error loading tasks';
        console.error('Error loading tasks:', error);
      }
    });
  }

  onFilterChange(): void {
    this.loadTasks();
  }

  onCreateTask(): void {
    if (this.taskForm.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formValue = this.taskForm.value;
    const deadlineValue = formValue.deadline;
    console.log('Raw form control value:', this.taskForm.get('deadline')?.value);

    const request = {
      ...formValue,
      deadline: deadlineValue ? new Date(deadlineValue + ':00') : undefined 
    };

    console.log('Form value deadline:', formValue.deadline);
    console.log('Converted deadline:', request.deadline);

    if (this.isEditMode && this.selectedTaskId) {
      this.taskService.updateTask(this.selectedTaskId, request).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            this.successMessage = 'Task updated successfully';
            this.loadTasks();
            this.resetForm();
          }
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = 'Error updating task';
        }
      });
    } else {
      this.taskService.createTask(request).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            this.successMessage = 'Task created successfully';
            this.loadTasks();
            this.resetForm();
          }
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = 'Error creating task';
        }
      });
    }
  }

  onEditTask(task: UserTask): void {
    this.isEditMode = true;
    this.selectedTaskId = task.taskID;
    
    this.taskForm.patchValue({
      taskName: task.taskName,
      taskDescription: task.taskDescription,
      assignedUserIDs: task.assignedUserIDs || [],
      deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '',
      status: task.status
    });
  }

  onDeleteTask(taskId: number): void {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    this.taskService.deleteTask(taskId).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = 'Task deleted successfully';
          this.loadTasks();
        }
      },
      error: (error) => {
        this.errorMessage = 'Error deleting task';
      }
    });
  }

  onUpdateStatus(taskId: number, status: TaskStatus): void {
    this.taskService.updateTaskStatus(taskId, { currentStatus: status }).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = 'Task status updated';
          this.loadTasks();
        }
      },
      error: (error) => {
        this.errorMessage = 'Error updating status';
      }
    });
  }

  resetForm(): void {
    this.taskForm.reset({
      taskName: '',
      taskDescription: '',
      assignedUserIDs: [],
      deadline: '',
      status: TaskStatus.ToDo
    });
    this.isEditMode = false;
    this.selectedTaskId = undefined;
  }

  getStatusLabel(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.ToDo: return 'To Do';
      case TaskStatus.InProgress: return 'In Progress';
      case TaskStatus.Completed: return 'Completed';
      case TaskStatus.UnAssigned: return 'Unassigned';
      case TaskStatus.Deleted: return 'Deleted';
      default: return 'Unknown';
    }
  }

  getStatusClass(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.ToDo: return 'status-todo';
      case TaskStatus.InProgress: return 'status-inprogress';
      case TaskStatus.Completed: return 'status-completed';
      case TaskStatus.UnAssigned: return 'status-unassigned';
      case TaskStatus.Deleted: return 'status-deleted';
      default: return '';
    }
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      }
    });
  }
}