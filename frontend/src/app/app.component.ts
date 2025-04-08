import { Component } from '@angular/core';
import { AuthService } from './auth.service';
import {
  RouterOutlet,
  Router,
  RouterLink,
  RouterLinkActive
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { NotificationComponent } from './notification/notification.component';
import { NotificationService } from './notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NotificationComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  isLoggedIn = false;
  userFullName = '';

  constructor(private authService: AuthService,
    private notificationService: NotificationService,
     private router: Router) {
    this.authService.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
    });

    this.authService.currentUser$.subscribe(user => {
      this.userFullName = user?.fullName || '';
    });
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
      this.notificationService.show('Logged out', 'success');
    });
  }

  deleteAccount() {
    this.authService.deleteAccount().subscribe({
      next: () => {
        this.notificationService.show('Account deleted', 'danger');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Delete failed:', err);
        this.notificationService.show('Failed to delete account', 'danger');
      }
    });
  }
}