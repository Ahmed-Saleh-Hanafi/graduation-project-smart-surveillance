import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
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

  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;

  cameras: any[] = [];
  private pc!: RTCPeerConnection;

  // 👇 مهم عشان الـ placeholder
  videoReady: boolean = false;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    this.loadCameras();
  }

  loadCameras() {
    this.dashboardService.getCameras().subscribe(res => {
      this.cameras = res.data;
    });
  }

  async selectCamera(id: number) {
    await this.startWebRTC(id);
    
  }

  async startWebRTC(id: number) {

    // لو فيه اتصال قديم اقفله
    if (this.pc) {
      this.pc.close();
    }

    this.videoReady = false;

    this.pc = new RTCPeerConnection();

    // 🎥 استقبال الفيديو
    this.pc.ontrack = (event) => {
      const stream = event.streams[0];

      this.videoPlayer.nativeElement.srcObject = stream;
      this.videoPlayer.nativeElement.play();

      this.videoReady = true; // 👈 الفيديو اشتغل
    };

    // 📡 create offer
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    // 📡 send to backend
    const answer = await this.dashboardService.startStream(id, offer);

    if (!answer) {
      console.error('No answer from server');
      return;
    }

    await this.pc.setRemoteDescription(answer);
  }
  
}