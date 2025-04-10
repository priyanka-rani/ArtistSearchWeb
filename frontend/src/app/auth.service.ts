import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from './notification.service';

interface User {
  fullName: string;
  email: string;
  avatar: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = '/api';
  public currentUser$ = new BehaviorSubject<User | null>(null);
  private isBrowser: boolean;
  private sessionExpiredShown = false;

  constructor(private http: HttpClient,
    private router: Router,
    private notificationService: NotificationService) {
    const platformId = inject(PLATFORM_ID);
    this.isBrowser = isPlatformBrowser(platformId);

    // Always attempt to load profile (cookie-based)
    if (this.isBrowser) {
      this.fetchProfile();
    }
  }

  get isLoggedIn$() {
    return this.currentUser$.pipe(map(user => !!user));
  }

  register(fullName: string, email: string, password: string) {
    this.resetSessionFlag();
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/register`,
      { fullName, email, password },
      { withCredentials: true }
    ).pipe(
      switchMap(() => this.fetchProfile()),
      catchError(error => {
        throw new Error(error.error.message || 'Registration failed');
      })
    );
  }


  login(email: string, password: string) {
    this.resetSessionFlag();
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/login`,
      { email, password },
      { withCredentials: true }
    ).pipe(
      switchMap(() => this.fetchProfile()),
      map(() => true),
      catchError(error => {
        throw new Error(error.error.message || 'Login failed');
      })
    );
  }

  logout() {
    this.currentUser$.next(null);
    return this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true });
  }

  deleteAccount(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/account`, { withCredentials: true }).pipe(
      tap(() => this.currentUser$.next(null)),
      catchError(error => {
        console.error('Delete account failed:', error);
        return throwError(() => new Error('Account deletion failed'));
      })
    );
  }

  public loading$ = new BehaviorSubject<boolean>(true); // 🔄 New loading state

  fetchProfile(): Observable<User | null> {
    return this.http.get<User>(`${this.apiUrl}/me`, {
      withCredentials: true
    }).pipe(
      tap(user => {
        this.currentUser$.next(user);
        this.loading$.next(false);
      }),
      catchError(() => {
        this.currentUser$.next(null);
        this.loading$.next(false);
        return of(null);
      })
    );
  }

  handleSessionExpiration() {
    if (!this.isBrowser) return;
    if (!this.sessionExpiredShown) {
      this.sessionExpiredShown = true;
      this.currentUser$.next(null);
      this.notificationService.show('Session expired. You have been logged out.', 'danger');
      this.router.navigate(['/']);
    }
  }

  // Reset the flag on successful login or register
  resetSessionFlag() {
    this.sessionExpiredShown = false;
  }
}
