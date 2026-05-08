import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard implements OnInit {

  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;

  cameras: any[] = [];
  errorMessage: string | null = null;
  loading = false;
  private pc!: RTCPeerConnection;

  videoReady: boolean = false;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    this.loadCameras();
  }

  loadCameras() {
    this.loading = true;
    this.errorMessage = null;

    this.dashboardService.getCameras().subscribe(
      res => {
        console.log('Dashboard cameras response', res);
        this.cameras = (res && (res.data ?? res)) || [];
        this.loading = false;
      },
      error => {
        console.error('Failed to load cameras', error);
        this.errorMessage = 'Unable to load cameras. Check the API and browser console.';
        this.cameras = [];
        this.loading = false;
      }
    );
  }

  async selectCamera(id: number) {
    await this.startWebRTC(id);
    
  }

  async startWebRTC(id: number) {

  
    if (this.pc) {
      this.pc.close();
    }

    this.videoReady = false;

    this.pc = new RTCPeerConnection();

    this.pc.ontrack = (event) => {
      const stream = event.streams[0];

      this.videoPlayer.nativeElement.srcObject = stream;
      this.videoPlayer.nativeElement.play();

      this.videoReady = true; 
    };

    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    const answer = await this.dashboardService.startStream(id, offer);

    if (!answer) {
      console.error('No answer from server');
      return;
    }

    await this.pc.setRemoteDescription(answer);
  }
  
}
