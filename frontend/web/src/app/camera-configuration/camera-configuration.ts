import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CameraService, Camera } from '../services/camera.service';

@Component({
  selector: 'app-camera-configuration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './camera-configuration.html',
  styleUrl: './camera-configuration.css',
})
export class CameraConfiguration implements OnInit {

  cameras: Camera[] = [];

  isModalOpen = false;
  mode: 'create' | 'edit' = 'create';
  selectedIndex: number | null = null;

  form: Camera = this.emptyForm();

  constructor(private cameraService: CameraService) {}

  ngOnInit() {
    this.loadCameras();
  }

  // تحميل البيانات من الباك
  loadCameras() {
    this.cameraService.getAll().subscribe({
      next: (res: any) => {
        this.cameras = res.data ?? []; // ✔ حماية لو data فاضية
      },
      error: (err) => {
        console.error('Load cameras error:', err);
      }
    });
  }

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

      this.cameraService.create(this.form).subscribe({
        next: () => {
          this.loadCameras();
          this.closeModal();
        },
        error: (err) => console.error('Create error:', err)
      });

    } else if (this.mode === 'edit' && this.selectedIndex !== null) {

      const id = (this.cameras[this.selectedIndex] as any).id;

      this.cameraService.update(id, this.form).subscribe({
        next: () => {
          this.loadCameras();
          this.closeModal();
        },
        error: (err) => console.error('Update error:', err)
      });
    }
  }

  // حذف
  delete(index: number) {

    const id = (this.cameras[index] as any).id;

    if (confirm('Are you sure you want to delete this camera?')) {
      this.cameraService.delete(id).subscribe({
        next: () => {
          this.loadCameras();
        },
        error: (err) => console.error('Delete error:', err)
      });
    }
  }

  // فورم فاضي
  emptyForm(): Camera {
    return {
      name: '',
      IpAddress: '',
      port: '',
      username: '',
      password: '',
      path: ''
    };
  }
}