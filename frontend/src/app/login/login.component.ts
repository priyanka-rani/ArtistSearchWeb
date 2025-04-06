import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  user = {
    email: '',
    password: ''
  };

  loading = false;
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  onLogin() {
    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.user.email, this.user.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/search']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.message || 'Login failed';
      }
    });
  }
}