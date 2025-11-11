import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { User, initializeEmptyUser } from '../../models/user.model';

interface Alert {
  message: string;
  type: 'success' | 'error';
  timeout?: any;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css'],
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  currentUser: any;
  loginUser:User = initializeEmptyUser();
  isAdmin: boolean = false;

  userForm!: FormGroup;
  isEditMode = true;
  selectedUserId?: number;
  isEditingSelf = true;

  searchTerm = '';
  loading = false;
  alerts: Alert[] = [];

  showDeleteConfirm = false;
  userToDelete?: User;
  showNavMenu = false;

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.isAdmin = this.currentUser?.userRole === 'admin';

    this.userForm = this.formBuilder.group({
      firstName: ['', Validators.required],
      middleName: [''],
      lastName: ['', Validators.required],
      displayName: [''],
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
      confirmPassword: [''],
    });

    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getAllUsers().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success && response.data) {
          this.users = response.data;
          this.applyFilter();
          this.onEditUser(this.loginUser);
        }
      },
      error: (error) => {
        this.loading = false;
        this.showToast('Error loading users', 'error');
      },
    });
  }

  applyFilter(): void {
    this.loginUser = this.users.find(
      (u) => u.userID === this.currentUser.userID
    ) || initializeEmptyUser();

    if (!this.searchTerm) {
      this.filteredUsers = this.users.filter(
        (u) => u.userID !== this.currentUser.userID
      );
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredUsers = this.users.filter(
        (user) =>
          user.userID !== this.currentUser.userID &&
          (user.firstName.toLowerCase().includes(term) ||
            user.lastName.toLowerCase().includes(term) ||
            user.displayName?.toLowerCase().includes(term) ||
            user.username.toLowerCase().includes(term) ||
            user.email.toLowerCase().includes(term))
      );
    }
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  onEditUser(user: User): void {
    this.isEditMode = true;
    this.selectedUserId = user.userID;
    this.isEditingSelf = user.userID === this.currentUser?.userID;

    console.log('Editing user:', user);
    this.userForm.patchValue({
      firstName: user.firstName,
      middleName: user.middleName || '',
      lastName: user.lastName,
      displayName: user.displayName || '',
      username: user.username,
      email: user.email,
      password: '',
      confirmPassword: '',
    });

    // Make password optional for editing
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('confirmPassword')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.userForm.get('confirmPassword')?.updateValueAndValidity();
  }

  onCreateNewUser(): void {
    this.resetForm();
    this.isEditMode = false;
    this.isEditingSelf = false;

    // Make password required for new users
    this.userForm
      .get('password')
      ?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('confirmPassword')?.setValidators([Validators.required]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.userForm.get('confirmPassword')?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.showToast('Please fill in all required fields correctly', 'error');
      return;
    }

    const formValue = this.userForm.value;

    // Check if passwords match when provided
    if (
      formValue.password &&
      formValue.password !== formValue.confirmPassword
    ) {
      this.showToast('Passwords do not match', 'error');
      return;
    }

    this.loading = true;

    if (this.isEditMode && this.selectedUserId) {
      // Update user
      const updateRequest = {
        firstName: formValue.firstName,
        middleName: formValue.middleName || undefined,
        lastName: formValue.lastName,
        displayName: formValue.displayName || undefined,
        username: formValue.username,
        email: formValue.email,
        password: formValue.password || undefined, // Only include if provided
      };

      this.userService
        .updateUser(this.selectedUserId, updateRequest)
        .subscribe({
          next: (response) => {
            this.loading = false;
            if (response.success) {
              this.showToast('User updated successfully', 'success');
              this.loadUsers();
              this.resetForm();

              // If user edited themselves, update current user info
              if (this.isEditingSelf) {
                const updatedUser = { ...this.currentUser, ...updateRequest };
                this.authService.updateCurrentUser(updatedUser);
              }
            }
          },
          error: () => {
            this.loading = false;
            this.showToast('Error updating user', 'error');
          },
        });
    } else {
      // Create new user
      const createRequest = {
        firstName: formValue.firstName,
        middleName: formValue.middleName || undefined,
        lastName: formValue.lastName,
        displayName: formValue.displayName || undefined,
        username: formValue.username,
        userRole: 'user',
        email: formValue.email,
        password: formValue.password,
      };

      this.userService.createUser(createRequest).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            this.showToast('User created successfully', 'success');
            this.loadUsers();
            this.resetForm();
          }
        },
        error: () => {
          this.loading = false;
          this.showToast(
            'Error creating user. Username or email may already exist.',
            'error'
          );
        },
      });
    }
  }

  confirmDelete(user: User): void {
    this.userToDelete = user;
    this.showDeleteConfirm = true;
  }

  onDeleteUser(): void {
    if (!this.userToDelete) return;

    const userId = this.userToDelete.userID;
    this.showDeleteConfirm = false;

    this.userService.deleteUser(userId).subscribe({
      next: (response) => {
        if (response.success) {
          this.showToast('User deleted successfully', 'success');
          this.loadUsers();
          this.userToDelete = undefined;
        }
      },
      error: () => {
        this.showToast('Error deleting user', 'error');
      },
    });
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.userToDelete = undefined;
  }

  resetForm(): void {
    this.userForm.reset({
      firstName: '',
      middleName: '',
      lastName: '',
      displayName: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
    this.isEditMode = true;
    this.selectedUserId = undefined;
    this.isEditingSelf = true;
  }

  getInitials(user: User): string {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';

    if (firstName && lastName) {
      return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }

    return user.username.charAt(0).toUpperCase();
  }

  showToast(message: string, type: 'success' | 'error'): void {
    const newAlert: Alert = { message, type };
    this.alerts.push(newAlert);
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

  goBack(): void {
    this.router.navigate(['/tasks']);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
    });
  }

  toggleNavMenu(): void {
    this.showNavMenu = !this.showNavMenu;
  }
}
