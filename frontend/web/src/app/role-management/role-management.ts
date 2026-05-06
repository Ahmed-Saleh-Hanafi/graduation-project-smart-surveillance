import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, User } from '../services/user.service';
import { CameraService } from '../services/camera.service';
import { UserCameraService } from '../services/user-cameras.service';

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './role-management.html'
})
export class RoleManagement implements OnInit {

  users: User[] = [];
  cameras: any[] = [];

  userCameras: any[] = [];
  otherCameras: any[] = [];

  openedUserId: number | null = null;

  constructor(
    private userService: UserService,
    private cameraService: CameraService,
    private userCameraService: UserCameraService
  ) {}

  ngOnInit() {
    this.loadUsers();
    this.loadCameras();
  }
loadUsers() {
  this.userService.getAll().subscribe({
    next: (res: any) => {
      console.log('Users:', res);

      if (res.isSuccess) {
        this.users = res.data; // ✅ الصح
      } else {
        this.users = [];
      }
    },
    error: err => {
      console.log(err);
      this.users = [];
    }
  });
}

  loadCameras() {
    this.cameraService.getAll().subscribe((res: any) => {
      this.cameras = res.data;
    });
  }

toggleUser(userId: number) {

  if (this.openedUserId === userId) {
    this.openedUserId = null;
    return;
  }

  this.openedUserId = userId;

  this.userCameraService.getUserCameras(userId).subscribe((res: any) => {

    this.userCameras = res.data || [];

    this.otherCameras = this.cameras.filter(
      c => !this.userCameras.some((uc: any) => uc.id === c.id)
    );

  });
}

  addCamera(userId: number, cameraId: number) {
  this.userCameraService.add(userId, cameraId).subscribe(() => {
    this.refreshUser(userId);
  });
}

removeCamera(userId: number, cameraId: number) {
  this.userCameraService.remove(userId, cameraId).subscribe(() => {
    this.refreshUser(userId);
  });
}

refreshUser(userId: number) {
  this.userCameraService.getUserCameras(userId).subscribe((res: any) => {

    this.userCameras = res.data || [];

    this.otherCameras = this.cameras.filter(
      c => !this.userCameras.some((uc: any) => uc.id === c.id)
    );

  });
}
}