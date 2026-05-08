import { Routes } from '@angular/router';
import { Login } from './login/login';
import { CameraConfiguration } from './camera-configuration/camera-configuration';
import { authGuard } from './auth-guard';
import { Dashboard } from './dashboard/dashboard';
import { Alerts } from './alerts/alerts';
import { UserManagement } from './user-management/user-management';
import { RoleManagement } from './role-management/role-management';
import { DetectionManagement } from './detection-management/detection-management';
export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'CameraConfiguration', component: CameraConfiguration, canActivate: [authGuard] },
  { path: 'Dashboard', component: Dashboard },
 {
  path: 'Alerts',
  loadComponent: () =>
    import('./alerts/alerts').then(m => m.Alerts)
},
{path: 'usermanagement',component: UserManagement},
{path: 'rolemanagement',component: RoleManagement},
{path: 'detectionmanagement',component: DetectionManagement},
];