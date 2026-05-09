import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DetectionService, Detection } from '../services/detection.service';
import { CameraService } from '../services/camera.service';
import { of } from 'rxjs';
import { catchError, map, timeout, finalize } from 'rxjs/operators';

interface CameraGroup {
  cameraId: number;
  cameraName: string;
  cameraIp: string;
  cameraPort: number;
  detections: Detection[];
}

@Component({
  selector: 'app-detection-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './detection-management.html',
  styleUrl: './detection-management.css',
})
export class DetectionManagement implements OnInit {
  cameraGroups: CameraGroup[] = [];
  allDetections: Detection[] = [];
  cameras: any[] = [];
  loading = true;
  detectionsLoading = false;
  errorMessage: string | null = null;
  filterDate: string = '';

  // Camera modal state
  selectedCamera: CameraGroup | null = null;
  isCameraModalOpen = false;
  modalFilterDate: string = '';
  filteredDetections: Detection[] = [];

  constructor(
    private detectionService: DetectionService,
    private cameraService: CameraService
  ) {}

  ngOnInit() {
    this.loadData();
  }
loadData() {
  this.loading = true;
  this.errorMessage = null;

  this.cameraService.getAll().pipe(
    timeout(10000),
    map((res: any) => Array.isArray(res) ? res : res.data || []),
    catchError(() => of([]))
  ).subscribe((cameras: any[]) => {

    this.cameras = cameras;

    // اعمل الكروت بس فاضية من غير detections
    this.cameraGroups = this.cameras.map(cam => ({
      cameraId: cam.id,
      cameraName: cam.name,
      cameraIp: cam.ipAddress,
      cameraPort: cam.port,
      detections: []   // فاضي دلوقتي
    }));

    this.loading = false;
  });
}
buildGroups() {

  console.log('CAMERAS:', this.cameras);
  console.log('DETECTIONS:', this.allDetections);

  const groups: CameraGroup[] = [];

  // اعمل كارت لكل كاميرا حتى لو مفيش detections
  for (const cam of this.cameras || []) {

    const cameraDetections = (this.allDetections || []).filter(
      (d: any) => d.cameraId === cam.id
    );

    cameraDetections.sort(
      (a: any, b: any) =>
        new Date(b.detectedAt).getTime() -
        new Date(a.detectedAt).getTime()
    );

    groups.push({
      cameraId: cam.id,
      cameraName: cam.name || `Camera ${cam.id}`,
      cameraIp: cam.ipAddress || 'Unknown',
      cameraPort: cam.port || 0,
      detections: cameraDetections
    });
  }

  this.cameraGroups = groups;

  console.log('FINAL GROUPS:', this.cameraGroups);
}

  get totalDetections(): number {
    return this.cameraGroups.reduce(
      (sum, g) => sum + g.detections.length,
      0
    );
  }

  get totalCameras(): number {
    return this.cameraGroups.length;
  }

  // --- Camera Modal ---

openCamera(group: CameraGroup) {
  this.selectedCamera = group;
  this.modalFilterDate = '';
  this.isCameraModalOpen = true;

  // 🔥 هنا بقى نحمل الديتكشنز
  this.detectionsLoading = true;

  this.detectionService.getByCamera(group.cameraId).pipe(
    map((res: any) => Array.isArray(res) ? res : res.data || []),
    catchError(() => of([]))
  ).subscribe((detections: Detection[]) => {

    this.filteredDetections = detections;
    this.selectedCamera!.detections = detections;

    this.detectionsLoading = false;
  });
}

  closeCameraModal() {
    this.isCameraModalOpen = false;
    this.selectedCamera = null;
    this.filteredDetections = [];
    this.modalFilterDate = '';
  }

  onModalFilterDate() {
    if (!this.selectedCamera) return;
    if (!this.modalFilterDate) {
      this.filteredDetections = [...this.selectedCamera.detections];
      return;
    }
    const filterDate = this.modalFilterDate; // YYYY-MM-DD
    this.filteredDetections = this.selectedCamera.detections.filter(det => {
      const detDate = new Date(det.detectedAt);
      const detDateStr =
        detDate.getFullYear() + '-' +
        String(detDate.getMonth() + 1).padStart(2, '0') + '-' +
        String(detDate.getDate()).padStart(2, '0');
      return detDateStr === filterDate;
    });
  }

  clearModalFilter() {
    this.modalFilterDate = '';
    if (this.selectedCamera) {
      this.filteredDetections = [...this.selectedCamera.detections];
    }
  }

  // --- Helpers ---

  formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatFullDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  truncate(text: string, max: number): string {
    if (!text) return '';
    return text.length > max ? text.substring(0, max) + '...' : text;
  }

  getTypeColor(type: string): string {
    const colors: Record<string, string> = {
      'Intrusion': '#6366f1',
      'Tampering': '#8b5cf6',
      'FaceDetection': '#ec4899',
      'FaceDetected': '#ec4899',
      'MotionDetected': '#f59e0b',
      'MotionDetection': '#f59e0b',
      'VehicleDetected': '#10b981',
      'VehicleDetection': '#10b981',
      'ObjectLeft': '#ef4444',
      'Loitering': '#f97316',
      'UnknownFace': '#64748b',
    };
    return colors[type] || '#6366f1';
  }

  getTypeBgColor(type: string): string {
    const colors: Record<string, string> = {
      'Intrusion': '#eef2ff',
      'Tampering': '#f5f3ff',
      'FaceDetection': '#fdf2f8',
      'FaceDetected': '#fdf2f8',
      'MotionDetected': '#fffbeb',
      'MotionDetection': '#fffbeb',
      'VehicleDetected': '#ecfdf5',
      'VehicleDetection': '#ecfdf5',
      'ObjectLeft': '#fef2f2',
      'Loitering': '#fff7ed',
      'UnknownFace': '#f8fafc',
    };
    return colors[type] || '#eef2ff';
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'Intrusion': 'shield',
      'Tampering': 'warning',
      'FaceDetection': 'face',
      'FaceDetected': 'face',
      'MotionDetected': 'directions_run',
      'MotionDetection': 'directions_run',
      'VehicleDetected': 'directions_car',
      'VehicleDetection': 'directions_car',
      'ObjectLeft': 'inventory_2',
      'Loitering': 'person_alert',
      'UnknownFace': 'person_off',
    };
    return icons[type] || 'radar';
  }

  onFilterDate() {
    if (!this.filterDate) {
      this.loadData();
      return;
    }
    this.loading = true;
    this.detectionService.getByDay(this.filterDate).pipe(
      map((res: any) => (res && (res.data ?? res)) || []),
      catchError(() => of([]))
    ).subscribe((detections: any) => {
      this.allDetections = detections;
      this.buildGroups();
      this.loading = false;
    });
  }

  clearFilter() {
    this.filterDate = '';
    this.loadData();
  }

  refresh() {
    if (this.filterDate) {
      this.onFilterDate();
    } else {
      this.loadData();
    }
  }
}
