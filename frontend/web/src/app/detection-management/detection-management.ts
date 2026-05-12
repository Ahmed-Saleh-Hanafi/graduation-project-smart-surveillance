import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DetectionService, Detection } from '../services/detection.service';
import { CameraService } from '../services/camera.service';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

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
  
  errorMessage: string | null = null;
  filterDate: string = '';
  isFetching = false; 

  selectedDetection: Detection | null = null;
  isDetectionModalOpen = false;

  constructor(
    private detectionService: DetectionService,
    private cameraService: CameraService
  ) {}

  ngOnInit() {
    this.loadFromCache();
    this.loadInitialData();
  }

  loadFromCache() {
    try {
      const cachedCameras = localStorage.getItem('camguard_cameras');
      const cachedDetections = localStorage.getItem('camguard_detections');
      
      if (cachedCameras) this.cameras = JSON.parse(cachedCameras);
      if (cachedDetections) this.allDetections = JSON.parse(cachedDetections);

      if (this.cameras.length > 0) this.buildGroups(); 
    } catch (e) {
      console.error('Error reading from cache', e);
    }
  }

  loadInitialData() {
    this.errorMessage = null;
    this.isFetching = true;

    this.cameraService.getAll().pipe(
      map((res: any) => (res && (res.data ?? res)) || []),
      catchError(() => of([]))
    ).subscribe((cameras: any[]) => {
      if (cameras.length > 0) {
        this.cameras = cameras;
        localStorage.setItem('camguard_cameras', JSON.stringify(cameras));
        this.buildGroups();
      }

      this.detectionService.getAll().pipe(
        map((res: any) => (res && (res.data ?? res)) || []),
        catchError(() => of([]))
      ).subscribe((detections: Detection[]) => {
        this.allDetections = detections;
        localStorage.setItem('camguard_detections', JSON.stringify(detections));
        this.buildGroups();
        this.isFetching = false;
      });
    });
  }

  buildGroups() {
    const groups: CameraGroup[] = [];

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
  }

  get totalDetections(): number {
    return this.cameraGroups.reduce((sum, g) => sum + g.detections.length, 0);
  }

  get totalCameras(): number {
    return this.cameraGroups.length;
  }

  // --- الفانكشناليتي بتاعة الـ Resolve ---
  openDetectionModal(det: Detection) {
    this.selectedDetection = det;
    this.isDetectionModalOpen = true;

    // لو الديتيكشن لسه محلصلوش Resolve
    if (!det.isResolved) {
      // 1. نقلب اللون أخضر في الواجهة فوراً عشان الـ UX
      det.isResolved = true; 
      
      // 2. نبعت الطلب للباك إند (POST Request زي ما في الـ Swagger)
      this.detectionService.markAsResolved(det.id).subscribe({
        next: () => {
          console.log(`Detection ${det.id} successfully resolved in backend.`);
          // 3. نحدث الكاش عشان لو اليوزر عمل ريفريش يفضل لونه أخضر وميرجعش أحمر تاني
          localStorage.setItem('camguard_detections', JSON.stringify(this.allDetections));
        },
        error: (err) => {
          console.error('Error resolving detection in backend:', err);
          // لو حصل مشكلة في الباك إند (مثلا السيرفر واقع)، نرجع اللون أحمر تاني
          det.isResolved = false; 
        }
      });
    }
  }

  closeDetectionModal() {
    this.selectedDetection = null;
    this.isDetectionModalOpen = false;
  }

  // --- Filter Methods ---

  applyFilter() {
    if (!this.filterDate) {
      this.loadInitialData();
      return;
    }
    
    this.isFetching = true;
    this.detectionService.getByDay(this.filterDate).pipe(
      map((res: any) => (res && (res.data ?? res)) || []),
      catchError(() => of([]))
    ).subscribe((detections: Detection[]) => {
      this.allDetections = detections;
      this.buildGroups();
      this.isFetching = false;
    });
  }

  clearFilter() {
    this.filterDate = '';
    this.loadInitialData();
  }

  // --- Helpers ---

  formatFullDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
}