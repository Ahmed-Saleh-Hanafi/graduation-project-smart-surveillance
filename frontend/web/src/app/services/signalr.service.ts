import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';

@Injectable({
  providedIn: 'root'
})
export class SignalrService {

  private hubConnection!: signalR.HubConnection;

  startConnection() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5198/alertHub')
      .build();

    return this.hubConnection.start();
  }

  onAlert(callback: (data: any) => void) {
    this.hubConnection.on('ReceiveAlert', callback);
  }
}