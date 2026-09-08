import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { FirestoreCacheService } from './firestore-cache.service';

@Injectable({ providedIn: 'root' })
export class PatchCacheService {
  readonly refreshRequested = signal(0);
  private readonly cache = inject(FirestoreCacheService);

  get<T>(loadFresh: () => Observable<T>): Observable<T> {
    return this.cache.get('patches', loadFresh);
  }

  clear(): void { this.cache.clear('patches'); }

  requestForceRefresh(): void {
    this.clear();
    this.refreshRequested.update((value) => value + 1);
  }

}
