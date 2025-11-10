import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { TasksComponent } from './components/tasks/tasks.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/tasks', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'tasks', component: TasksComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/tasks' }
];
