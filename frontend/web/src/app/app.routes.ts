import { Routes } from '@angular/router';
import { Login } from './login/login';
import { CameraConfiguration } from './camera-configuration/camera-configuration';
import { authGuard } from './auth-guard';
import { Dashboard } from './dashboard/dashboard';
import { Alerts } from './alerts/alerts';
export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'CameraConfiguration', component: CameraConfiguration, canActivate: [authGuard] },
  { path: 'Dashboard', component: Dashboard },
  { path: 'Alerts', component: Alerts }
];