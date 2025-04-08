import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, map, Observable, tap, throwError } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

interface User {
  fullName: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = '/api';
  public currentUser$ = new BehaviorSubject<User | null>(null);
  private isBrowser: boolean;

  constructor(private http: HttpClient) {
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
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/register`,
      { fullName, email, password },
      { withCredentials: true }
    ).pipe(
      map(res => {
        this.fetchProfile();
        return res;
      }),
      catchError(error => {
        throw new Error(error.error.message || 'Registration failed');
      })
      );
  }

  login(email: string, password: string) {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/login`,
      { email, password },
      { withCredentials: true }
    ).pipe(
      map(() => {
        this.fetchProfile();
        return true;
      }),
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

  private fetchProfile() {
    this.http.get<User>(`${this.apiUrl}/profile`, { withCredentials: true }).subscribe({
      next: user => this.currentUser$.next(user),
      error: () => this.currentUser$.next(null)
    });
  }
}
