import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CameraService, Camera, CameraView } from '../services/camera.service';
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

  s: any[] = [];

  isModalOpen = false;
  mode: 'create' | 'edit' = 'create';
  selectedIndex: number | null = null;

  form: Camera = this.emptyForm();

  constructor(
    private cameraService: CameraService,
    private cdr: ChangeDetectorRef,
  private showCameraDataService: ShowCameraDataService
  ) {}

  ngOnInit() {
    console.log("Component Loaded");
    this.veiwCameras();
  }

veiwCameras() {
  this.showCameraDataService.getAll().subscribe({
    next: (res: any) => {

      console.log("SUCCESS => ", res);

      this.s = res.data || res;

      console.log("CAMERAS => ", this.s);

      this.cdr.detectChanges();
    },

    error: (err) => {
      console.log("FULL ERROR => ", err);

      if (err.error) {
        console.log("ERROR BODY => ", err.error);
      }

      if (err.status) {
        console.log("STATUS => ", err.status);
      }
    }
  });
}

  loadCameras() {
    this.cameraService.getAll().subscribe({
      next: (res: any) => {

        this.cameras = res.data || res;

        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  openCreate() {
    this.mode = 'create';
    this.form = this.emptyForm();
    this.isModalOpen = true;
  }

  openEdit(index: number) {
    this.mode = 'edit';

    const id = this.s[index].id;

    this.cameraService.lol(id).subscribe({
      next: (res: any) => {
        this.form = res.data;
        this.isModalOpen = true;
      },
      error: err => console.log(err)
    });
  }

  closeModal() {
    this.isModalOpen = false;
  }

  save() {
    const { id, ...payload } = this.form;

    payload.port = Number(payload.port);

    if (this.mode === 'create') {

      this.cameraService.create(payload).subscribe({
        next: () => {
          this.veiwCameras();
          this.closeModal();
        },
        error: err => console.log(err)
      });

    } else if (this.mode === 'edit' && id) {

      this.cameraService.update(id, payload).subscribe({
        next: () => {
          this.veiwCameras();
          this.closeModal();
        },
        error: err => console.log(err)
      });

    }
  }

  delete(id?: number) {
    if (!id) return;

    if (confirm('Are you sure?')) {
      this.cameraService.delete(id).subscribe({
        next: () => this.veiwCameras(),
        error: err => console.log(err)
      });
    }
  }

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