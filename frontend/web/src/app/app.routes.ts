import { Routes } from '@angular/router';
import { Login } from './login/login';
import { CameraConfiguration } from './camera-configuration/camera-configuration';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'CameraConfiguration', component: CameraConfiguration }
];