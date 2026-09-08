import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideDatabase, getDatabase } from '@angular/fire/database';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { provideServiceWorker } from '@angular/service-worker';
import { environment } from '../environments/environment';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  // GitHub Pages cannot rewrite deep SPA URLs to index.html. Hash routing keeps
  // the requested document at the deployed application root on refresh.
  providers: [
    provideRouter(routes, withHashLocation()),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideDatabase(() => getDatabase()),
    // Kept during the cutover for the legacy backup/import screen and rollback.
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
    provideStorage(() => getStorage()),
    provideServiceWorker('ngsw-worker.js', {
      enabled: environment.production && !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};
