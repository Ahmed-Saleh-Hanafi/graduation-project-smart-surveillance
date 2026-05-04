import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, User } from '../services/user.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css'
})
export class UserManagement implements OnInit {

  users: User[] = [];
  isModalOpen = false;

  form: User = this.emptyForm();

constructor(
  private userService: UserService,
  private cdr: ChangeDetectorRef
) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.userService.getAll().subscribe({
      next: (res: any) => {
        this.users = res.data;
              this.cdr.detectChanges();

      },
      error: err => console.log(err)
    });
  }

  openCreate() {
    this.form = this.emptyForm();
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  save() {

    // ✅ validation قبل الإرسال
    if (!this.form.email || !this.form.password || !this.form.firstName || !this.form.lastName || !this.form.userName) {
      alert('Please fill all fields');
      return;
    }

    // ⚠️ مهم: بعت payload صريح
    const payload = {
      email: this.form.email,
      password: this.form.password,
      firstName: this.form.firstName,
      lastName: this.form.lastName,
      userName: this.form.userName
    };

    console.log('Sending:', payload);

    this.userService.create(payload).subscribe({
      next: (res: any) => {
        console.log(res);

        if (res.isSuccess) {
          this.loadUsers();
          this.closeModal();
        } else {
          alert(res.message);
        }
      },
      error: err => {
        console.log(err);
        console.log(err.error);

        // 👇 يطلعلك سبب الباسورد بالظبط
        alert(
          err.error?.errors?.Password?.[0] ||
          err.error?.message ||
          'API Error'
        );
      }
    });
  }

  emptyForm(): User {
    return {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      userName: ''
    };
  }
}