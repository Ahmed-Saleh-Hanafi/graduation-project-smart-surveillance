import { Component, signal,OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {CommonModule }from '@angular/common';
import { SignalrService } from './services/signalr.service';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {

  alerts: any[] = [];

  constructor(private signalr: SignalrService) {}

  ngOnInit() {
    this.signalr.startConnection()
      .then(() => {
        this.signalr.onAlert((data) => {

          this.alerts.push(data);

          // اختفاء بعد 5 ثواني
          setTimeout(() => {
            this.alerts.shift();
          }, 5000);

        });
      });
  }
}
