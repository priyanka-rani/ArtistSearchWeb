// auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { catchError, throwError } from 'rxjs';


let sessionExpiredShown = false;

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const notifier = inject(NotificationService);

  return next(req).pipe(
    catchError(error => {
      if (
        error.status === 401 &&
        !sessionExpiredShown &&
        !authService.loading$.value &&
        req.url.includes('/api') &&
        (
          req.url.includes('/me') ||
          req.url.includes('/favorites')
        )
      ) {
        sessionExpiredShown = true;

        authService.currentUser$.next(null);
        notifier.show('Session expired. You have been logged out.', 'danger');
        router.navigateByUrl('/');
      }

      return throwError(() => error);
    })
  );
};