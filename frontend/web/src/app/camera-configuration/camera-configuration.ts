import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CameraService, Camera,CameraView } from '../services/camera.service';
import { ChangeDetectorRef } from '@angular/core';
import { ShowCameraDataService } from '../services/show-camera-data.service';

@Component({
  selector: 'app-camera-configuration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './camera-configuration.html',
  styleUrl: './camera-configuration.css',
})
export class CameraConfiguration implements OnInit {

  cameras: Camera[] = [];
s: CameraView[]=[];
  isModalOpen = false;
  mode: 'create' | 'edit' = 'create';
  selectedIndex: number | null = null;

  form: Camera = this.emptyForm();

constructor(
  private cameraService: CameraService,
  private cdr: ChangeDetectorRef,
  private showcameradata: ShowCameraDataService
) {}

  ngOnInit() {
  console.log("Component Loaded");
  this.veiwCameras();
}
veiwCameras() {
  this.showcameradata.getAll().subscribe({
    next: (res: any) => {
this.s = res.data;      // 🔥 أجبر Angular يعمل refresh للـ UI
      this.cdr.detectChanges();
    },
    error: (err) => console.error(err)
  });
}
  // تحميل البيانات من الباك
loadCameras() {
  this.cameraService.getAll().subscribe({
    next: (res: any) => {
this.cameras = res.data;      // 🔥 أجبر Angular يعمل refresh للـ UI
      this.cdr.detectChanges();
    },
    error: (err) => console.error(err)
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

  const id = this.s[index].id; // 👈 من ال view

  this.cameraService.lol(id).subscribe({
    next: (res: any) => {
      this.form = res.data; // 👈 full object جاهز للفورم
      this.isModalOpen = true;
    },
    error: err => console.log(err)
  });
}

  // إغلاق المودال
  closeModal() {
    this.isModalOpen = false;
  }

  // حفظ (Create / Edit)
save() {
  const { id, ...payload } = this.form;

  payload.port = Number(payload.port);

  if (this.mode === 'create') {

    this.cameraService.create(payload).subscribe({
      next: () => this.veiwCameras(),
      error: err => console.log(err)
    });

  } else if (this.mode === 'edit' && id) {

    this.cameraService.update(id, payload).subscribe({
      next: () => this.veiwCameras(),
      error: err => console.log(err)
    });

  }

  this.closeModal();
}

  // حذف
delete(id?: number) {
  if (!id) return;

  if (confirm('Are you sure?')) {
    this.cameraService.delete(id).subscribe({
      next: () => this.veiwCameras(),
      error: err => console.log(err)
    });
  }
}

  // فورم فاضي
  emptyForm(): Camera {
    return {
      name: '',
      ipAddress: '',
      port: 0,
      username: '',
      password: '',
      path: ''
    };
  }
}