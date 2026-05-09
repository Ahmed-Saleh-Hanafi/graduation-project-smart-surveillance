import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, User, UpdateUserDto } from '../services/user.service';
import { CameraService } from '../services/camera.service';
import { UserCameraService } from '../services/user-cameras.service';
import { ChangeDetectorRef } from '@angular/core';
import { ShowCameraDataService } from '../services/show-camera-data.service';
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

  openedUserId: any = null;
  isEditMode = false;
  isModalOpen = false;
  editForm: User = this.emptyForm();
  isLoading = true;

  constructor(
    private userService: UserService,
    private cameraService: CameraService,
    private userCameraService: UserCameraService,
    private cdr: ChangeDetectorRef,
    private showCameraDataService: ShowCameraDataService
  ) { }

  ngOnInit() {
    this.isLoading = true;
    this.loadUsers();
    this.loadCameras();
  }

  loadUsers() {
    this.userService.getAll().subscribe({
      next: (res: any) => {
        console.log('Users:', res);
        if (res.isSuccess) {
          this.users = res.data;
          this.checkLoadingComplete();
        } else {
          this.users = [];
          this.checkLoadingComplete();
        }
      },
      error: err => {
        console.log(err);
        this.users = [];
        this.checkLoadingComplete();
      }
    });
  }

  loadCameras() {
    this.cameraService.getAll().subscribe({
      next: (res: any) => {
        console.log('Cameras loaded:', res);
        this.cameras = res.data || [];
        this.checkLoadingComplete();
      },
      error: (err) => {
        console.error('Error loading cameras:', err);
        this.cameras = [];
        this.checkLoadingComplete();
      }
    });
  }

  checkLoadingComplete() {
    // Wait for both users and cameras to load
    if (this.users.length >= 0 && this.cameras.length >= 0) {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }
  toggleUser(userId: string) {

    if (this.openedUserId === userId) {
      this.openedUserId = null;
      return;
    }

    this.openedUserId = userId;

    this.userCameraService.getUserCameras(userId).subscribe({
      next: (res: any) => {

        console.log('USER CAMERAS => ', res);

        this.userCameras = [...(res.data || [])];

        this.otherCameras = this.cameras.filter(
          cam => !this.userCameras.some(
            (uCam: any) => Number(uCam.id) === Number(cam.id)
          )
        );

        console.log('ALL CAMERAS => ', this.cameras);
        console.log('ASSIGNED => ', this.userCameras);
        console.log('NOT ASSIGNED => ', this.otherCameras);

        this.cdr.detectChanges();
      },

      error: (err) => {
        console.log(err);
        this.userCameras = [];
        this.otherCameras = [...this.cameras];
        this.cdr.detectChanges();
      }
    });
  } addCamera(userId: string, cameraId: number) {
    this.userCameraService.add(userId, cameraId).subscribe(() => {
      this.refreshUser(userId);
    });
  }

  removeCamera(userId: string, cameraId: number) {
    this.userCameraService.remove(userId, cameraId).subscribe(() => {
      this.refreshUser(userId);
    });
  }

  refreshUser(userId: string) {

    this.userCameraService.getUserCameras(userId).subscribe({
      next: (res: any) => {

        this.userCameras = Array.isArray(res)
          ? res
          : (res.data || []);

      }
    });

    this.userCameraService.getUnassignedCameras(userId).subscribe({
      next: (res: any) => {

        this.otherCameras = Array.isArray(res)
          ? res
          : (res.data || []);

      }
    });

  } openCreate() {
    this.isEditMode = false;
    this.editForm = this.emptyForm();
    this.isModalOpen = true;
  }

  openEdit(user: User) {
    this.isEditMode = true;
    this.editForm = {
      id: user.id ?? '',
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userName: user.userName,
      password: ''
    };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  save() {
    if (!this.editForm.email || !this.editForm.firstName || !this.editForm.lastName || !this.editForm.userName) {
      alert('Please fill all fields except password for update.');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.editForm.email)) {
      alert('Please enter a valid email address.');
      return;
    }

    if (this.isEditMode) {
      // Update existing user
      const updatePayload: UpdateUserDto = {
        Id: this.editForm.id ?? '',
        Email: this.editForm.email,
        UserName: this.editForm.userName,
        FirstName: this.editForm.firstName,
        LastName: this.editForm.lastName,
        password: this.editForm.password?.trim() || undefined
      };

      this.userService.update(updatePayload).subscribe({
        next: (res: any) => {
          if (res.isSuccess) {
            this.loadUsers();
            this.closeModal();
          } else {
            alert(res.message || 'Update failed');
          }
        },
        error: err => {
          console.error(err);
          alert(err.error?.message || 'Update API error');
        }
      });
    } else {
      // Create new user
      if (!this.editForm.password || this.editForm.password.length < 6) {
        alert('Password is required and must be at least 6 characters long.');
        return;
      }

      const createPayload: User = {
        email: this.editForm.email,
        userName: this.editForm.userName,
        firstName: this.editForm.firstName,
        lastName: this.editForm.lastName,
        password: this.editForm.password
      };

      this.userService.create(createPayload).subscribe({
        next: (res: any) => {
          if (res.isSuccess) {
            this.loadUsers();
            this.closeModal();
          } else {
            alert(res.message);
          }
        },
        error: err => {
          console.error(err);
          alert(err.error?.errors?.Password?.[0] || err.error?.message || 'API Error');
        }
      });
    }
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