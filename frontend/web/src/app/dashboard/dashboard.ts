import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {

  videoUrl: string = "";
  cameras: any[] = [];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    this.loadCameras();

    // افتراضي أول كاميرا
    this.videoUrl = this.dashboardService.getCameraStream(1);
  }

  loadCameras() {
    this.dashboardService.getCameras().subscribe(res => {
      this.cameras = res.data;
    });
  }

  selectCamera(id: number) {
    this.videoUrl = this.dashboardService.getCameraStream(id);
  }
}