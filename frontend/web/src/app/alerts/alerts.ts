import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alerts.html'
})
export class Alerts implements OnInit {

  alertsHistory: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    this.http.get('http://localhost:5198/api/alerts')
      .subscribe((res: any) => {
        this.alertsHistory = res.data;
      });
  }
}