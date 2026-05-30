import { Routes } from '@angular/router';
import { Login } from './login/login';
import { CameraConfiguration } from './camera-configuration/camera-configuration';
import { authGuard } from './auth-guard';
import { Dashboard } from './dashboard/dashboard';
import { SensorManagement } from './sensor-management/sensor-management';
import { UserManagement } from './user-management/user-management';
import { RoleManagement } from './role-management/role-management';
import { DetectionManagement } from './detection-management/detection-management';
import { AiScheduleComponent } from './ai-schedule/ai-schedule';
export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'CameraConfiguration', component: CameraConfiguration, canActivate: [authGuard] },
  { path: 'Dashboard', component: Dashboard, canActivate: [authGuard] },
 
{path: 'usermanagement',component: UserManagement, canActivate: [authGuard]},
{path: 'rolemanagement',component: RoleManagement, canActivate: [authGuard]},
{path: 'detectionmanagement',component: DetectionManagement, canActivate: [authGuard]},
{path: 'SensorManagement',component: SensorManagement, canActivate: [authGuard]},
{path: 'AiScheduleComponent',component: AiScheduleComponent, canActivate: [authGuard]},


];