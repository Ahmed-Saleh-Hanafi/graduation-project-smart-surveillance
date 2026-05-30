import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SensorService } from '../services/sensor.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sensor-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sensor-management.html',
  styleUrls: ['./sensor-management.css']
})
export class SensorManagement implements OnInit, OnDestroy {

  sensors: any[] = [];
  liveReadings: { [sensorId: number]: number } = {}; // قاموس بيحفظ القرايات اللايف
  
  // Modal States
  isSensorModalOpen = false;
  isAlertModalOpen = false;
  isEditMode = false;
  
  form: any = this.emptyForm();
  
  // Alerts Data
  selectedSensorForAlerts: any = null;
  sensorAlerts: any[] = [];

  private subscriptions: Subscription = new Subscription();

  constructor(
    private sensorService: SensorService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadSensors();
    
    // تشغيل SignalR والاستماع للتحديثات اللايف
    this.sensorService.startSignalRConnection();
    
    this.subscriptions.add(
      this.sensorService.readingReceived$.subscribe(data => {
        // تحديث القراءة اللايف للسينسور ده
        this.liveReadings[data.sensorId] = data.sensorValue;
        this.cdr.detectChanges();
      })
    );

    this.subscriptions.add(
      this.sensorService.alertReceived$.subscribe(data => {
        console.warn('New Alert Received:', data.message);
        // لو الـ Modal مفتوح لنفس السينسور، ضيف الأليرت الجديد لايف
        if (this.isAlertModalOpen && this.selectedSensorForAlerts?.id === data.sensorId) {
          this.sensorAlerts.unshift(data); // حطه في أول اللستة
          this.cdr.detectChanges();
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.sensorService.stopSignalRConnection();
  }

  loadSensors() {
    this.sensorService.getAll().subscribe({
      next: (res) => {
        this.sensors = res.data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  // --- CRUD Operations ---

  openCreate() {
    this.isEditMode = false;
    this.form = this.emptyForm();
    this.isSensorModalOpen = true;
  }

  openEdit(sensor: any) {
    this.isEditMode = true;
    // زي ما طلبت، بنعمل GetById عشان نجيب الداتا الكاملة قبل التعديل
    this.sensorService.getById(sensor.id).subscribe({
      next: (res) => {
        this.form = { ...res.data };
        this.isSensorModalOpen = true;
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  saveSensor() {
    // تجهيز الداتا للإضافة (add)
    if (!this.isEditMode) {
      const payload = {
        sensorName: this.form.sensorName,
        sensorType: Number(this.form.sensorType),
        threshold: Number(this.form.threshold)
      };
      this.sensorService.addSensor(payload).subscribe({
        next: (res) => {
          if (res.isSuccess) {
            this.loadSensors();
            this.isSensorModalOpen = false;
          }
        },
        error: (err) => alert(err.error?.message || 'Error adding sensor')
      });
    } 
    // تجهيز الداتا للتعديل (update)
    else {
      const payload = {
        id: this.form.id,
        sensorName: this.form.sensorName,
        sensorType: Number(this.form.sensorType),
        createdAt: this.form.createdAt,
        isActive: this.form.isActive,
        threshold: Number(this.form.threshold)
      };
      this.sensorService.updateSensor(payload).subscribe({
        next: (res) => {
          if (res.isSuccess) {
            this.loadSensors();
            this.isSensorModalOpen = false;
          }
        },
        error: (err) => alert(err.error?.message || 'Error updating sensor')
      });
    }
  }

  deleteSensor(id: number) {
    if (confirm('Are you sure you want to delete this sensor? All its readings and alerts will be lost.')) {
      this.sensorService.deleteSensor(id).subscribe({
        next: (res) => {
          if (res.isSuccess) this.loadSensors();
        },
        error: (err) => console.error(err)
      });
    }
  }

  // --- Alerts Logic ---

  openAlerts(sensor: any) {
    this.selectedSensorForAlerts = sensor;
    this.isAlertModalOpen = true;
    this.sensorAlerts = []; // تفريغ القديم لحد ما يحمل

    this.sensorService.getSensorAlerts(sensor.id).subscribe({
      next: (res) => {
        // بنرتبهم من الأحدث للأقدم عشان الجديد يظهر فوق
        this.sensorAlerts = (res.data || []).sort((a:any, b:any) => 
           new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()
        );
        this.cdr.detectChanges();
      },
      error: (err) => {
        // لو مفيش أليرت هترجع 400، هنتجاهلها ونسيب اللستة فاضية
        console.warn(err.error?.message);
      }
    });
  }

  resolveAlert(alert: any) {
    this.sensorService.resolveAlert(alert.id).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          alert.isResolved = true; // نقلبها لايف في الـ UI
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error(err)
    });
  }

  closeModals() {
    this.isSensorModalOpen = false;
    this.isAlertModalOpen = false;
  }

  emptyForm() {
    return { id: 0, sensorName: '', sensorType: 1, threshold: 0, isActive: true, createdAt: new Date() };
  }

  // Helpers
  getSensorTypeName(type: number): string {
    const types: any = { 1: 'Temperature', 2: 'Motion', 3: 'Gas', 4: 'Sound' };
    return types[type] || 'Unknown';
  }

  getSensorIcon(type: number): string {
    const icons: any = { 1: 'thermostat', 2: 'directions_run', 3: 'air', 4: 'mic' };
    return icons[type] || 'sensors';
  }
}