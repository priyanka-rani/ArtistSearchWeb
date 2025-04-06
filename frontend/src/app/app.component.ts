import { Component } from '@angular/core';
import { AuthService } from './auth.service';
import {
  RouterOutlet,
  Router,
  RouterLink,
  RouterLinkActive
} from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  isLoggedIn = false;
  userFullName = '';

  constructor(private authService: AuthService, private router: Router) {
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
    });
  }
}