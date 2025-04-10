import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  user = {
    fullname: '',
    email: '',
    password: ''
  };

  loading = false;
  errorMessage = '';
  backendErrorField = '';
  backendErrorMessage = '';


  constructor(private authService: AuthService, private notificationService: NotificationService, private router: Router) { }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.router.navigate(['/']);
      }
    });
  }
  onRegister() {
    this.loading = true;
    this.backendErrorField = '';
    this.backendErrorMessage = '';

    this.authService.register(this.user.fullname, this.user.email, this.user.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/']);
        this.notificationService.show('User registered successfully.', 'success');
      },
      error: (err) => {
        this.loading = false;

        // Optional: Parse server message to identify field
        if (err.message.includes('exists')) {
          this.backendErrorField = 'email';
          this.backendErrorMessage = 'User with this email already exists.';
        } else {
          this.backendErrorField = 'fullname'; // fallback
          this.backendErrorMessage = err.message || 'Registration failed.';
        }
      }
    });
  }
}