import { Routes } from '@angular/router';

import { AdminPatchPageComponent } from './pages/admin-patch-page.component';
import { BrowsePageComponent } from './pages/browse-page.component';
import { adminGuard } from './guards/admin.guard';
import { AdminRedirectComponent } from './pages/admin-redirect.component';
import { LogoutPageComponent } from './pages/logout-page.component';
import { AdminSystemsPageComponent } from './pages/admin-systems-page.component';
import { AdminTranslatorsPageComponent } from './pages/admin-translators-page.component';
import { AdminTagsPageComponent } from './pages/admin-tags-page.component';
import { AdminFirestoreDataPageComponent } from './pages/admin-firestore-data-page.component';
import { DonatePageComponent } from './pages/donate-page.component';
import { AdminServerCostPageComponent } from './pages/admin-server-cost-page.component';
import { ArticlesPageComponent } from './pages/articles-page.component';
import { ArticlePageComponent } from './pages/article-page.component';
import { AdminArticlesPageComponent } from './pages/admin-articles-page.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: BrowsePageComponent
  },
  { path: 'today', component: BrowsePageComponent, data: { browseKind: 'today' } },
  { path: 'new', component: BrowsePageComponent, data: { browseKind: 'week' } },
  { path: 'system/:slug', component: BrowsePageComponent, data: { browseKind: 'system' } },
  { path: 'translator/:slug', component: BrowsePageComponent, data: { browseKind: 'translator' } },
  { path: 'tag/:slug', component: BrowsePageComponent, data: { browseKind: 'tag' } },
  { path: 'rom', component: BrowsePageComponent, data: { browseKind: 'rom' } },
  { path: 'donate', component: DonatePageComponent },
  { path: 'articles', component: ArticlesPageComponent },
  { path: 'article/:slug', component: ArticlePageComponent },
  { path: 'admin/articles', component: AdminArticlesPageComponent, canActivate: [adminGuard] },
  { path: 'admin/articles/edit/new', component: AdminArticlesPageComponent, canActivate: [adminGuard] },
  { path: 'admin/articles/edit/:id', component: AdminArticlesPageComponent, canActivate: [adminGuard] },
  { path: 'admin/server-cost', component: AdminServerCostPageComponent, canActivate: [adminGuard] },
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
  { path: 'admin/firestore-data', component: AdminFirestoreDataPageComponent, canActivate: [adminGuard] },
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
