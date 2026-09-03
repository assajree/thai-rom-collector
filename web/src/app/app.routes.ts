import { Routes } from '@angular/router';

import { AdminPatchPageComponent } from './pages/admin-patch-page.component';
import { BrowsePageComponent } from './pages/browse-page.component';
import { adminGuard } from './guards/admin.guard';
import { AdminRedirectComponent } from './pages/admin-redirect.component';
import { LogoutPageComponent } from './pages/logout-page.component';
import { AdminSystemsPageComponent } from './pages/admin-systems-page.component';
import { AdminTranslatorsPageComponent } from './pages/admin-translators-page.component';
import { AdminTagsPageComponent } from './pages/admin-tags-page.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: BrowsePageComponent
  },
  { path: 'system/:slug', component: BrowsePageComponent, data: { browseKind: 'system' } },
  { path: 'translator/:slug', component: BrowsePageComponent, data: { browseKind: 'translator' } },
  { path: 'tag/:slug', component: BrowsePageComponent, data: { browseKind: 'tag' } },
  { path: 'rom', component: BrowsePageComponent, data: { browseKind: 'rom' } },
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
    path: 'admin/systems',
    component: AdminSystemsPageComponent,
    canActivate: [adminGuard]
  },
  { path: 'admin/translators', component: AdminTranslatorsPageComponent, canActivate: [adminGuard] },
  { path: 'admin/tags', component: AdminTagsPageComponent, canActivate: [adminGuard] },
  {
    path: 'login',
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
