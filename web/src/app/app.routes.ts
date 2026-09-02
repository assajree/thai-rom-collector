import { Routes } from '@angular/router';

import { AdminPatchPageComponent } from './pages/admin-patch-page.component';
import { BrowsePageComponent } from './pages/browse-page.component';
import { adminGuard } from './guards/admin.guard';
import { AdminRedirectComponent } from './pages/admin-redirect.component';
import { LogoutPageComponent } from './pages/logout-page.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: BrowsePageComponent
  },
  { path: 'system/:slug', component: BrowsePageComponent, data: { browseKind: 'system' } },
  { path: 'translator/:slug', component: BrowsePageComponent, data: { browseKind: 'translator' } },
  { path: 'tag/:slug', component: BrowsePageComponent, data: { browseKind: 'tag' } },
  {
    path: 'add-patch',
    component: AdminPatchPageComponent,
    canActivate: [adminGuard]
  },
  {
    path: 'add-patch/:id',
    component: AdminPatchPageComponent,
    canActivate: [adminGuard]
  },
  {
    path: 'admin',
    pathMatch: 'full',
    component: AdminRedirectComponent
  },
  {
    path: 'logout',
    pathMatch: 'full',
    component: LogoutPageComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];
