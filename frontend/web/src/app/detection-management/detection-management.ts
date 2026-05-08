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
  loading = true;
  errorMessage: string | null = null;
  filterDate: string = '';

  // Modal state
  selectedDetection: Detection | null = null;
  isModalOpen = false;

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

    this.cameraService.getAll().subscribe({
      next: (cameraRes: any) => {
        this.cameras = (cameraRes && (cameraRes.data ?? cameraRes)) || [];
      },
      error: () => {
        this.cameras = [];
        this.loadDetections();
      },
      complete: () => {
        this.loadDetections();
      }
    });
  }

  private loadDetections() {
    this.detectionService.getAll().subscribe({
      next: (detRes: any) => {
        this.allDetections = (detRes && (detRes.data ?? detRes)) || [];
      },
      error: () => {
        // Backend returns 400 when no detections — treat as empty
        this.allDetections = [];
        this.buildGroups();
        this.loading = false;
      },
      complete: () => {
        this.buildGroups();
        this.loading = false;
      }
    });
  }

  buildGroups() {
    const map = new Map<number, CameraGroup>();

    // Always create a card for every camera
    for (const cam of this.cameras) {
      map.set(cam.id, {
        cameraId: cam.id,
        cameraName: cam.name || `Camera ${cam.id}`,
        cameraIp: cam.ipAddress || 'Unknown',
        cameraPort: cam.port || 0,
        detections: [],
      });
    }

    // Assign detections to their camera cards
    for (const det of this.allDetections) {
      if (!map.has(det.cameraId)) {
        map.set(det.cameraId, {
          cameraId: det.cameraId,
          cameraName: `Camera ${det.cameraId}`,
          cameraIp: 'Unknown',
          cameraPort: 0,
          detections: [],
        });
      }
      map.get(det.cameraId)!.detections.push(det);
    }

    // Sort detections within each group by detectedAt descending
    for (const group of map.values()) {
      group.detections.sort(
        (a, b) =>
          new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
      );
    }

    this.cameraGroups = Array.from(map.values());
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

  openDetection(det: Detection) {
    this.selectedDetection = det;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedDetection = null;
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
