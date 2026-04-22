import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Camera {
  name: string;
  ip: string;
  port: string;
  username: string;
  password: string;
  path: string;
}

@Component({
  selector: 'app-camera-configuration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './camera-configuration.html',
  styleUrl: './camera-configuration.css',
})
export class CameraConfiguration {

  cameras: Camera[] = [
    {
      name: 'Lobby Camera',
      ip: '192.168.1.10',
      port: '8080',
      username: 'admin',
      password: '1234',
      path: '/stream1'
    }
  ];

  isModalOpen = false;
  mode: 'create' | 'edit' = 'create';
  selectedIndex: number | null = null;

  form: Camera = this.emptyForm();

  // فتح إنشاء
  openCreate() {
    this.mode = 'create';
    this.form = this.emptyForm();
    this.isModalOpen = true;
  }

  // فتح تعديل
  openEdit(index: number) {
    this.mode = 'edit';
    this.selectedIndex = index;
    this.form = { ...this.cameras[index] };
    this.isModalOpen = true;
  }

  // إغلاق المودال
  closeModal() {
    this.isModalOpen = false;
  }

  // حفظ (Create / Edit)
  save() {
    if (this.mode === 'create') {
      this.cameras.push({ ...this.form });
    } else if (this.mode === 'edit' && this.selectedIndex !== null) {
      this.cameras[this.selectedIndex] = { ...this.form };
    }

    this.closeModal();
  }

  // حذف
  delete(index: number) {
    if (confirm('Are you sure you want to delete this camera?')) {
      this.cameras.splice(index, 1);
    }
  }

  // فورم فاضي
  emptyForm(): Camera {
    return {
      name: '',
      ip: '',
      port: '',
      username: '',
      password: '',
      path: ''
    };
  }
}