import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
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
  private pc!: RTCPeerConnection;

  videoReady: boolean = false;
  selectedCamera: any = null;

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef // 1. ضفنا الـ ChangeDetectorRef هنا
  ) {}

  ngOnInit() {
    this.loadFromCache();
    this.loadCameras();
  }

  loadFromCache() {
    try {
      const cached = localStorage.getItem('camguard_dashboard_cameras');
      if (cached) {
        this.cameras = JSON.parse(cached);
      }
    } catch (e) {
      console.error('Cache read error', e);
    }
  }

  loadCameras() {
    this.errorMessage = null;

    this.dashboardService.getCameras().subscribe(
      res => {
        this.cameras = (res && (res.data ?? res)) || [];
        localStorage.setItem('camguard_dashboard_cameras', JSON.stringify(this.cameras));
      },
      error => {
        console.error('Failed to load cameras', error);
        this.errorMessage = 'Unable to connect to camera service.';
      }
    );
  }

  async selectCamera(cam: any) {
    this.selectedCamera = cam;
    this.cdr.detectChanges(); // نحدث الشاشة عشان نظهر كارد التحميل (اختياري بس بيسرع الاستجابة)
    
    setTimeout(async () => {
      await this.startWebRTC(cam.id);
    }, 0);
  }

  async startWebRTC(id: number) {
    if (this.pc) {
      this.pc.close();
    }

    this.videoReady = false;
    this.pc = new RTCPeerConnection();
    
    // نقول لـ WebRTC إننا داخلين نستقبل فيديو
    this.pc.addTransceiver('video', { direction: 'recvonly' });

    // الحدث ده بيحصل لما الفيديو يوصل من السيرفر
    this.pc.ontrack = (event) => {
      const stream = event.streams[0];
      if (this.videoPlayer && this.videoPlayer.nativeElement) {
        this.videoPlayer.nativeElement.srcObject = stream;
        this.videoPlayer.nativeElement.play().then(() => {
          this.videoReady = true; 
          
          // 2. السطر ده هو اللي هيحل مشكلة الضغطتين، بيجبر الصفحة تتحدث فوراً
          this.cdr.detectChanges(); 

        }).catch(err => console.error('Play prevented by browser:', err));
      }
    };

    try {
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      this.dashboardService.getWebRTCUrl(id).subscribe(async (res) => {
        if (!res.isSuccess || !res.data?.webRTCUrl) {
          console.error('Failed to get WebRTC URL from backend');
          return;
        }

        let mediaMtxUrl = res.data.webRTCUrl;
        
        if(!mediaMtxUrl.endsWith('/whep')) {
          mediaMtxUrl = `${mediaMtxUrl}/whep`;
        }

        const sdpResponse = await fetch(mediaMtxUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/sdp'
          },
          body: offer.sdp 
        });

        if (!sdpResponse.ok) {
          console.error('MediaMTX rejected the offer', await sdpResponse.text());
          return;
        }

        const answerSdp = await sdpResponse.text();
        await this.pc.setRemoteDescription({
          type: 'answer',
          sdp: answerSdp
        });

      });

    } catch (err) {
      console.error('WebRTC Initialization Error:', err);
    }
  }
}