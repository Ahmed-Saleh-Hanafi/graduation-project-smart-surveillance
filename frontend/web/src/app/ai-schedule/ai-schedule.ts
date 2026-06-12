import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AiScheduleService,
  AiSchedule,
  AiScheduleInterval,
} from '../services/ai-schedule.service';
import { CameraService } from '../services/camera.service';

interface FormInterval {
  startTime: string; // "HH:mm" from <input type="time">
  endTime: string;
}

interface ScheduleForm {
  cameraId: string;
  modelName: string;
  dayOfWeek: string; // 'null' | '0'…'6'
  intervals: FormInterval[];
}

@Component({
  selector: 'app-ai-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-schedule.html',
  styleUrls: ['./ai-schedule.css'],
})
export class AiScheduleComponent implements OnInit, OnDestroy {
  schedules: AiSchedule[] = [];
  cameras: any[] = [];

  isModalOpen = false;
  isSaving = false;
  errorMsg = '';

  form: ScheduleForm = this.emptyForm();

  private pollTimer: any;

  // ── Display helpers ──────────────────────────────────────────────────────────

  readonly models = [
    { value: 'face', label: 'Face Detection', icon: 'person', color: 'text-blue-600', bg: 'bg-blue-50' },
    { value: 'abnormal', label: 'Abnormal Behavior', icon: 'warning', color: 'text-orange-600', bg: 'bg-orange-50' },
    { value: 'weapon', label: 'Weapon Detection', icon: 'crisis_alert', color: 'text-red-600', bg: 'bg-red-50' },
  ];

  readonly days = [
    { label: 'Every Day', value: 'null' },
    { label: 'Sunday', value: '0' },
    { label: 'Monday', value: '1' },
    { label: 'Tuesday', value: '2' },
    { label: 'Wednesday', value: '3' },
    { label: 'Thursday', value: '4' },
    { label: 'Friday', value: '5' },
    { label: 'Saturday', value: '6' },
  ];

  constructor(
    private scheduleService: AiScheduleService,
    private cameraService: CameraService,
    private cdr: ChangeDetectorRef
  ) { }

  // ── Lifecycle ─────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadCameras();
    this.loadSchedules();
    // Refresh every 60 s
    this.pollTimer = setInterval(() => this.loadSchedules(), 60_000);
  }

  ngOnDestroy(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  // ── Data loading ──────────────────────────────────────────────────────────────

  loadCameras(): void {
    this.cameraService.getAll().subscribe({
      next: (res: any) => {
        // Camera API may return wrapped {data:[]} or a plain array
        this.cameras = res?.data ?? (Array.isArray(res) ? res : []);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('[Cameras] load failed', err),
    });
  }

  loadSchedules(): void {
    this.scheduleService.getAll().subscribe({
      next: (res) => {
        console.log('[Schedules] raw response:', res);
        this.schedules = res?.data ?? [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[Schedules] load failed', err);
        this.schedules = [];
        this.cdr.detectChanges();
      },
    });
  }

  // ── Modal ─────────────────────────────────────────────────────────────────────

  openCreate(): void {
    this.form = this.emptyForm();
    this.errorMsg = '';
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.errorMsg = '';
  }

  private emptyForm(): ScheduleForm {
    return {
      cameraId: '',
      modelName: 'face',
      dayOfWeek: 'null',
      intervals: [{ startTime: '08:00', endTime: '18:00' }],
    };
  }

  // ── Intervals in form ─────────────────────────────────────────────────────────

  addInterval(): void {
    this.form.intervals.push({ startTime: '00:00', endTime: '01:00' });
  }

  removeInterval(index: number): void {
    if (this.form.intervals.length > 1) {
      this.form.intervals.splice(index, 1);
    }
  }

  // ── Save ──────────────────────────────────────────────────────────────────────

  save(): void {
    this.errorMsg = '';

    if (!this.form.cameraId) {
      this.errorMsg = 'Please select a camera.';
      return;
    }

    // Validate intervals
    for (const iv of this.form.intervals) {
      if (!iv.startTime || !iv.endTime) {
        this.errorMsg = 'All time windows must have a start and end time.';
        return;
      }
      if (iv.startTime >= iv.endTime) {
        this.errorMsg = 'Each start time must be earlier than its end time.';
        return;
      }
    }

    // Build payload — append ':00' to convert "HH:mm" → "HH:mm:ss" for TimeSpan
    const payload = {
      cameraId: Number(this.form.cameraId),
      modelName: this.form.modelName,
      dayOfWeek: this.form.dayOfWeek === 'null' ? null : Number(this.form.dayOfWeek),
      intervals: this.form.intervals.map((iv) => ({
        startTime: iv.startTime + ':00',
        endTime: iv.endTime + ':00',
      })),
    };

    console.log('[Create] sending payload:', payload);
    this.isSaving = true;

    this.scheduleService.create(payload).subscribe({
      next: (res) => {
        this.isSaving = false;
        console.log('[Create] response:', res);
        if (res.isSuccess) {
          this.loadSchedules();
          this.closeModal();
        } else {
          this.errorMsg = res.message || 'Failed to save schedule.';
        }
      },
      error: (err) => {
        this.isSaving = false;
        console.error('[Create] HTTP error:', err);
        // Show the most specific message available
        this.errorMsg =
          err.error?.message ||
          err.error?.title ||
          (err.error?.errors ? JSON.stringify(err.error.errors) : null) ||
          `Server error (${err.status})`;
      },
    });
  }

  // ── Delete schedule ───────────────────────────────────────────────────────────

  deleteSchedule(id: number): void {
    if (!confirm('Delete this entire schedule rule?')) return;

    this.scheduleService.deleteSchedule(id).subscribe({
      next: (res) => {
        if (res.isSuccess) this.loadSchedules();
        else alert(res.message);
      },
      error: (err) => console.error('[Delete] failed', err),
    });
  }

  // ── Toggle active ─────────────────────────────────────────────────────────────

  toggleSchedule(schedule: AiSchedule): void {
    const newState = !schedule.isActive;
    this.scheduleService.toggle(schedule.id, newState).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          // Optimistic update
          schedule.isActive = newState;
          this.cdr.detectChanges();
        } else {
          alert(res.message);
        }
      },
      error: (err) => console.error('[Toggle] failed', err),
    });
  }

  // ── UI helpers ────────────────────────────────────────────────────────────────

  getModelInfo(modelName: string) {
    return (
      this.models.find((m) => m.value === (modelName || '').toLowerCase()) ??
      this.models[0]
    );
  }

  /**
   * Formats an array of intervals into "08:00 – 18:00  •  20:00 – 22:00"
   * Backend sends TimeSpan as "HH:mm:ss" so we slice to 5 chars.
   */
  formatIntervals(intervals: AiScheduleInterval[]): string {
    if (!intervals?.length) return '—';
    return intervals
      .map((iv) => {
        const s = (iv.startTime ?? '').slice(0, 5);
        const e = (iv.endTime ?? '').slice(0, 5);
        return `${s} – ${e}`;
      })
      .join('  •  ');
  }

  isOvernight(iv: FormInterval): boolean {
    return !!iv.startTime && !!iv.endTime && iv.startTime >= iv.endTime;
  }

  trackById(_: number, item: AiSchedule) {
    return item.id;
  }
}