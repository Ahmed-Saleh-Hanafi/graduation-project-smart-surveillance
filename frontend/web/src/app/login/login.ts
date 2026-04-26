import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth';
import { Router } from '@angular/router';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
message: string = '';
  email: string = '';
  password: string = '';

 constructor(
  private authService: AuthService,
  private router: Router
) {}

  login() {
  const data = {
    email: this.email,
    password: this.password
  };

  this.authService.login(data).subscribe({
    next: (res: any) => {

      console.log('Login Success:', res);

      // (اختياري دلوقتي) حفظ التوكن
      const token = res.data?.token;

if (token) {
  localStorage.setItem('token', token);
  console.log('TOKEN SAVED:', token);
}

      // 🔥 تحويل المستخدم لصفحة camera
      this.router.navigate(['/CameraConfiguration']);
    },

   error: (err) => {

  console.log('Login Error:', err);

  this.message = err.error?.message || 'Login failed';
}
  });
}
}