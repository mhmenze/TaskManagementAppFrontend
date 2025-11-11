import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { UserTask, TaskStatus } from '../../models/task.model';
import { User } from '../../models/user.model';
import { TaskFilterRequest } from '../../models/task-request.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

interface Alert {
  message: string;
  type: 'success' | 'error';
  timeout?: any;
}

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css'],
})
export class TasksComponent implements OnInit {
  tasks: UserTask[] = [];
  filteredTasks: UserTask[] = [];
  users: User[] = [];
  showUserMenu = false;
  isAdmin = false;

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
  // errorMessage = '';
  // successMessage = '';
  alerts: Alert[] = [];

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
    this.isAdmin = this.currentUser?.role === 'admin';

    this.taskForm = this.formBuilder.group({
      taskName: ['', Validators.required],
      taskDescription: [''],
      assignedUserIDs: [[]],
      deadline: [''],
      deadlineTime: [''],
      status: [TaskStatus.ToDo],
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
      },
    });
  }

  loadTasks(): void {
    this.loading = true;
    const filter: TaskFilterRequest = {
      status: this.filterStatus,
      searchTerm: this.filterSearch || undefined,
      sortBy: this.sortBy,
      sortDescending: this.sortDescending,
    };

    console.log(filter);
    this.taskService.getAllTasks(filter).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success && response.data) {
          this.tasks = response.data;
          //   this.tasks = response.data.map(
          //     task => ({...task,
          //     deadline: task.deadline
          //       ? new Date(new Date(task.deadline).getTime() + new Date(task.deadline).getTimezoneOffset() * 60000)
          //       : null
          // }));
          this.filteredTasks = this.tasks;
        }
      },
      error: (error) => {
        this.loading = false;
        // this.errorMessage = 'Error loading tasks';
        this.showToast('Error loading task', 'error');
      },
    });
  }

  showToast(message: string, type: 'success' | 'error'): void {
    const newAlert: Alert = { message, type };
    this.alerts.push(newAlert);

    // Auto-dismiss after 5 seconds
    newAlert.timeout = setTimeout(() => {
      this.closeAlert(this.alerts.indexOf(newAlert));
    }, 5000);
  }

  closeAlert(index: number): void {
    if (index >= 0 && index < this.alerts.length) {
      clearTimeout(this.alerts[index].timeout);
      this.alerts.splice(index, 1);
    }
  }

  onFilterChange(): void {
    this.loadTasks();
  }

  onCreateTask(): void {
    if (this.taskForm.invalid) {
      return;
    }

    this.loading = true;
    // this.errorMessage = '';
    // this.successMessage = '';

    const formValue = this.taskForm.value;
    const date = formValue.deadline;
    const time = formValue.deadlineTime;
    let combinedDeadline: Date | undefined;

    if (date) {
      const d = new Date(date);
      if (time) {
        const [hours, minutes] = time.split(':').map(Number);
        const localDate = new Date(
          d.getFullYear(),
          d.getMonth(),
          d.getDate(),
          hours,
          minutes,
          0
        );

        combinedDeadline = new Date(
          localDate.getTime() - localDate.getTimezoneOffset() * 60000
        );
      } else {
        combinedDeadline = new Date(
          d.getFullYear(),
          d.getMonth(),
          d.getDate(),
          0,
          0,
          0
        );
      }
    }

    if (this.isEditMode && this.selectedTaskId) {
      const request = {
        taskName: formValue.taskName,
        taskDescription: formValue.taskDescription || undefined,
        assignedUserIDs: formValue.assignedUserIDs?.length
          ? formValue.assignedUserIDs
          : undefined,
        status: +formValue.status, // ensure numeric
        deadline: combinedDeadline ? new Date(combinedDeadline) : undefined,
      };
      this.taskService.updateTask(this.selectedTaskId, request).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            // this.successMessage = 'Task updated successfully';
            this.showToast('Task updated successfully', 'success');
            this.loadTasks();
            this.resetForm();
          }
        },
        error: () => {
          this.loading = false;
          // this.errorMessage = 'Error updating task';
          this.showToast('Error updating task', 'error');
        },
      });
    } else {
      const request = {
        ...formValue,
        deadline: combinedDeadline,
      };
      this.taskService.createTask(request).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            // this.successMessage = 'Task created successfully';
            this.showToast('Task created successfully', 'success');
            this.loadTasks();
            this.resetForm();
          }
        },
        error: () => {
          this.loading = false;
          // this.errorMessage = 'Error creating task';
          this.showToast('Error creating task', 'error');
        },
      });
    }
  }

  onEditTask(task: UserTask): void {
    this.isEditMode = true;
    this.selectedTaskId = task.taskID;

    let deadlineDate: Date | null = null;
    let deadlineTime: string = '';

    if (task.deadline) {
      const d = new Date(task.deadline);
      deadlineDate = new Date(d.getTime());

      // Extract time in HH:mm format
      const hours = deadlineDate.getHours().toString().padStart(2, '0');
      const minutes = deadlineDate.getMinutes().toString().padStart(2, '0');
      deadlineTime = `${hours}:${minutes}`;
    }

    this.taskForm.patchValue({
      taskName: task.taskName,
      taskDescription: task.taskDescription,
      assignedUserIDs: task.assignedUserIDs || [],
      deadline: deadlineDate,
      deadlineTime: deadlineTime,
      status: task.status,
    });
  }

  onDeleteTask(taskId: number): void {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    this.taskService.deleteTask(taskId).subscribe({
      next: (response) => {
        if (response.success) {
          // this.successMessage = 'Task deleted successfully';
          this.showToast('Task deleted successfully', 'success');
          this.loadTasks();
        }
      },
      error: (error) => {
        // this.errorMessage = 'Error deleting task';
        this.showToast('Error deleting task', 'error');
      },
    });
  }

  onUpdateStatus(taskId: number, status: TaskStatus): void {
    this.taskService.updateTaskStatus(taskId, status).subscribe({
      next: (response) => {
        if (response.success) {
          // this.successMessage = 'Task status updated';
          this.showToast('Task status updated', 'success');
          this.loadTasks();
        }
      },
      error: (error) => {
        // this.errorMessage = 'Error updating status';
        this.showToast('Error updating status', 'error');
      },
    });
  }

  resetForm(): void {
    this.taskForm.reset({
      taskName: '',
      taskDescription: '',
      assignedUserIDs: [],
      deadline: '',
      status: TaskStatus.ToDo,
    });
    this.isEditMode = false;
    this.selectedTaskId = undefined;
  }

  getStatusLabel(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.ToDo:
        return 'To Do';
      case TaskStatus.InProgress:
        return 'In Progress';
      case TaskStatus.Completed:
        return 'Completed';
      case TaskStatus.UnAssigned:
        return 'Unassigned';
      case TaskStatus.Deleted:
        return 'Deleted';
      default:
        return 'Unknown';
    }
  }

  getStatusClass(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.ToDo:
        return 'status-todo';
      case TaskStatus.InProgress:
        return 'status-inprogress';
      case TaskStatus.Completed:
        return 'status-completed';
      case TaskStatus.UnAssigned:
        return 'status-unassigned';
      case TaskStatus.Deleted:
        return 'status-deleted';
      default:
        return '';
    }
  }

  getUserById(userId: number): User | undefined {
    return this.users.find((u) => u.userID === userId);
  }

  getInitials(user: User): string {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';

    if (firstName && lastName) {
      return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    } else if (user.username) {
      return user.username.charAt(0).toUpperCase();
    }

    return '?';
  }

  getExtraAssigneesText(assignedUserIDs: number[]): string {
    const extraUsers = assignedUserIDs.slice(3);
    const names = extraUsers
      .map((id) => {
        const user = this.getUserById(id);
        return user
          ? user.displayName || `${user.firstName} ${user.lastName}`
          : 'Unknown User';
      })
      .join(', ');

    return `Also assigned to: ${names}`;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
    });
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  getUserInitials(): string {
    if (this.currentUser) {
      const firstName = this.currentUser.firstName || this.currentUser.displayName?.split(' ')[0] || '';
      const lastName = this.currentUser.lastName || this.currentUser.displayName?.split(' ')[1] || '';
      
      if (firstName && lastName) {
        return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
      } else if (firstName) {
        return firstName.substring(0, 2).toUpperCase();
      } else if (this.currentUser.username) {
        return this.currentUser.username.substring(0, 2).toUpperCase();
      }
    }
    return 'U';
  }

  navigateToUserManagement(): void {
    this.showUserMenu = false;
    this.router.navigate(['/user-management']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu-container')) {
      this.showUserMenu = false;
    }
  }
}
