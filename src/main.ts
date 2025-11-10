import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { importProvidersFrom } from '@angular/core';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { ErrorInterceptor } from './app/interceptors/error.interceptor';
import { AuthGuard } from './app/guards/auth.guard';
import { AuthService } from './app/services/auth.service';
import { TaskService } from './app/services/task.service';
import { UserService } from './app/services/user.service';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    importProvidersFrom(FormsModule, ReactiveFormsModule),
    provideAnimations(),

    // Your services
    AuthService,
    TaskService,
    UserService,
    AuthGuard,
    {
      provide: ErrorInterceptor,
      useClass: ErrorInterceptor,
      multi: true
    }
  ]
}).catch(err => console.error(err));
