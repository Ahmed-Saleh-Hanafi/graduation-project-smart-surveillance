import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiScheduleService, AiSchedule, AiScheduleInterval } from '../services/ai-schedule.service';
import { CameraService } from '../services/camera.service'; // عشان نجيب ليستة الكاميرات

@Component({
  selector: 'app-ai-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-schedule.html',
  styleUrls: ['./ai-schedule.css']
})
export class AiScheduleComponent implements OnInit, OnDestroy {

  schedules: AiSchedule[] = [];
  activeNow: AiSchedule[] = [];
  cameras: any[] = [];
  
  isModalOpen = false;
  timer: any;

  // Form State
  form = this.emptyForm();

  // Helpers للـ UI
  models = [
    { value: 'face', label: 'Face Detection', icon: 'person', color: 'text-blue-600', bg: 'bg-blue-50' },
    { value: 'abnormal', label: 'Abnormal Behavior', icon: 'warning', color: 'text-orange-600', bg: 'bg-orange-50' },
    { value: 'weapon', label: 'Weapon Detection', icon: 'crisis_alert', color: 'text-red-600', bg: 'bg-red-50' }
  ];

  days = [
    { label: 'Every Day', value: 'null' },
    { label: 'Sunday', value: '0' },
    { label: 'Monday', value: '1' },
    { label: 'Tuesday', value: '2' },
    { label: 'Wednesday', value: '3' },
    { label: 'Thursday', value: '4' },
    { label: 'Friday', value: '5' },
    { label: 'Saturday', value: '6' }
  ];

  constructor(
    private aiScheduleService: AiScheduleService,
    private cameraService: CameraService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadCameras();
    this.loadSchedules();
    this.loadActiveNow();
    
    // Polling كل 60 ثانية عشان الموديلز اللايف
    this.timer = setInterval(() => this.loadActiveNow(), 60_000);
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  loadCameras() {
    this.cameraService.getAll().subscribe({
      next: (res: any) => this.cameras = res.data || res,
      error: (err) => console.error('Failed to load cameras', err)
    });
  }

  loadSchedules() {
    this.aiScheduleService.getAll().subscribe({
      next: (res) => {
        this.schedules = res.data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  loadActiveNow() {
    this.aiScheduleService.getActiveNow().subscribe({
      next: (res) => {
        this.activeNow = res.data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  // --- Form Logic ---

  openCreate() {
    this.form = this.emptyForm();
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  emptyForm() {
    return {
      cameraId: '',
      modelName: 'face',
      dayOfWeek: 'null',
      intervals: [{ startTime: '08:00', endTime: '18:00' }]
    };
  }

  addInterval() {
    this.form.intervals.push({ startTime: '00:00', endTime: '00:00' });
  }

  removeInterval(index: number) {
    if (this.form.intervals.length > 1) {
      this.form.intervals.splice(index, 1);
    }
  }

  save() {
    if (!this.form.cameraId) {
      alert('Please select a camera.');
      return;
    }

    const payload = {
      cameraId: Number(this.form.cameraId),
      modelName: this.form.modelName,
      dayOfWeek: this.form.dayOfWeek === 'null' ? null : Number(this.form.dayOfWeek),
      // تظبيط الثواني زي ما الباك إند طالب
      intervals: this.form.intervals.map(i => ({
        startTime: i.startTime + ':00',
        endTime: i.endTime + ':00'
      }))
    };

    this.aiScheduleService.create(payload).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          this.loadSchedules();
          this.loadActiveNow(); // نحدث اللايف بالمرة
          this.closeModal();
        } else {
          alert(res.message);
        }
      },
      error: (err) => alert(err.error?.message || 'Error creating schedule')
    });
  }

  deleteSchedule(id: number) {
    if (confirm('Are you sure you want to delete this schedule?')) {
      this.aiScheduleService.delete(id).subscribe({
        next: (res) => {
          if (res.isSuccess) {
            this.loadSchedules();
            this.loadActiveNow();
          }
        }
      });
    }
  }

  toggleSchedule(schedule: AiSchedule) {
    const newState = !schedule.isActive;
    this.aiScheduleService.toggle(schedule.id, newState).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          schedule.isActive = newState;
          this.loadActiveNow(); // نحدث اللايف
        }
      }
    });
  }

  // --- UI Helpers ---

  getModelInfo(modelName: string) {
    return this.models.find(m => m.value === modelName) || this.models[0];
  }

  formatIntervals(intervals: AiScheduleInterval[]): string {
    return intervals.map(i => `${i.startTime.slice(0,5)} – ${i.endTime.slice(0,5)}`).join('  •  ');
  }

  isOvernight(interval: AiScheduleInterval | any): boolean {
    return interval.startTime > interval.endTime;
  }
}