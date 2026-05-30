import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SensorService {
  private baseUrl = 'http://localhost:5198/api/Sensor';
  private hubConnection: signalR.HubConnection | undefined;

  // Subjects عشان نبعت بيهم الداتا اللايف للـ Component
  public readingReceived$ = new Subject<any>();
  public alertReceived$ = new Subject<any>();

  constructor(private http: HttpClient) {}

  // --- REST APIs ---
  
  getAll() {
    return this.http.get<any>(`${this.baseUrl}/GetAll`);
  }

  getById(id: number) {
    return this.http.get<any>(`${this.baseUrl}/GetById/${id}`);
  }

  addSensor(payload: any) {
    return this.http.post<any>(`${this.baseUrl}/add`, payload);
  }

  updateSensor(payload: any) {
    return this.http.put<any>(`${this.baseUrl}/update`, payload);
  }

  deleteSensor(id: number) {
    return this.http.delete<any>(`${this.baseUrl}/delete/${id}`);
  }

  getSensorAlerts(sensorId: number) {
    return this.http.get<any>(`${this.baseUrl}/Sensor/${sensorId}/alerts`);
  }

  resolveAlert(alertId: number) {
    return this.http.put<any>(`${this.baseUrl}/alerts/${alertId}/resolve`, {});
  }

  // --- SignalR Integration ---

  startSignalRConnection() {
    const token = localStorage.getItem('token');
    
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`http://localhost:5198/hub/alerts?access_token=${token}`)
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .build();

    this.hubConnection.start()
      .then(() => console.log('SignalR Connected for Sensors!'))
      .catch(err => console.error('Error while starting SignalR connection: ' + err));

    this.hubConnection.on('ReceiveSensorReading', (data) => {
      this.readingReceived$.next(data);
    });

    this.hubConnection.on('ReceiveSensorAlert', (data) => {
      this.alertReceived$.next(data);
    });
  }

  stopSignalRConnection() {
    if (this.hubConnection) {
      this.hubConnection.stop();
    }
  }
}