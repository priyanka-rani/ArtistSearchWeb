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

  constructor(private authService: AuthService, 
    private notificationService:NotificationService,
    private router: Router) {}

  onRegister() {
    this.loading = true;
    this.errorMessage = '';

    this.authService.register(this.user.fullname, this.user.email, this.user.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/search']);
        this.notificationService.show('User registered successfully.', 'success');
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.message || 'Registration failed.';
      }
    });
  }
}