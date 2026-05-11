import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, User, UpdateUserDto } from '../services/user.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.html',
  styleUrls: ['./user-management.css']
})
export class UserManagement implements OnInit {

  users: User[] = [];
  isModalOpen = false;
  isEditMode = false;

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
        this.users = res.data || [];
        this.cdr.detectChanges();
      },
      error: err => console.log(err)
    });
  }

  openCreate() {
    this.isEditMode = false;
    this.form = this.emptyForm();
    this.isModalOpen = true;
  }
openEdit(user: User) {
    this.isEditMode = true;
    this.form = {
      id: user.id ?? '',
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userName: user.userName,
      password: ''
    };
    this.isModalOpen = true;
    
    // عشان الـ Modal يفتح فوراً بدون ما تحتاج تدوس مرتين
    this.cdr.detectChanges(); 
  }

  closeModal() {
    this.isModalOpen = false;
  }
  save() {
    // التأكد من ملء الحقول الأساسية
    if (!this.form.email || !this.form.firstName || !this.form.lastName || !this.form.userName) {
      alert('Please fill all fields except password for update.');
      return;
    }

    // --- حالة التعديل (Edit Mode) ---
    if (this.isEditMode) {
      // تم توحيد الحروف الكابيتال وتعديل الـ Password
      const updatePayload: UpdateUserDto = {
        Id: this.form.id ?? '',
        Email: this.form.email,
        UserName: this.form.userName,
        FirstName: this.form.firstName,
        LastName: this.form.lastName,
        Password: this.form.password?.trim() || "" // P كابيتال ونص فاضي بدل undefined
      } as any; // ضفنا as any مؤقتاً عشان لو الانترفيس عندك مكتوب سمول مايضربش إيرور

      this.userService.update(updatePayload).subscribe({
        next: (res: any) => {
          // التعديل هنا: بنتأكد إن res موجود الأول، أو لو الباك إند رجع null بنعتبره نجح
          if (!res || res.isSuccess !== false) {
            this.loadUsers();
            this.closeModal();
          } else {
            alert(res.message || 'Update failed');
          }
        },
        error: err => {
          console.error('Update Error:', err);
          alert(err.error?.message || 'Update API error. Check Console.');
        }
      });
      return;
    }

    // --- حالة الإضافة (Create Mode) ---
    const payload: User = {
      id: this.form.id,
      email: this.form.email,
      userName: this.form.userName,
      firstName: this.form.firstName,
      lastName: this.form.lastName,
      password: this.form.password?.trim() || ""
    };

    if (!payload.password) {
      alert('Password is required when creating a new user.');
      return;
    }

    this.userService.create(payload).subscribe({
      next: (res: any) => {
        if (!res || res.isSuccess !== false) {
          this.loadUsers();
          this.closeModal();
        } else {
          alert(res.message);
        }
      },
      error: err => {
        console.error('Create Error:', err);
        alert(err.error?.errors?.Password?.[0] || err.error?.message || 'API Error. Check Console.');
      }
    });
  }

  deleteUser(user: User) {
    if (!user.id) {
      return;
    }

    if (!confirm(`Delete ${user.userName || user.email}?`)) {
      return;
    }

    this.userService.delete(user.id).subscribe({
      next: (res: any) => {
        if (res.isSuccess) {
          this.loadUsers();
        } else {
          alert(res.message || 'Delete failed');
        }
      },
      error: err => {
        console.error(err);
        alert(err.error?.message || 'Delete API error');
      }
    });
  }

  emptyForm(): User {
    return {
      id: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      userName: ''
    };
  }
}