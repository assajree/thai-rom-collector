import { Injectable, signal } from '@angular/core';
import { Observable, catchError, defer, map, of, shareReplay, tap } from 'rxjs';

const CACHE_KEY = 'rom-collector:patches';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

interface CacheEntry<T> {
  savedAt: number;
  value: T;
}

@Injectable({ providedIn: 'root' })
export class PatchCacheService {
  readonly refreshRequested = signal(0);
  private cached$?: Observable<unknown>;

  get<T>(loadFresh: () => Observable<T>): Observable<T> {
    if (this.cached$) return this.cached$ as Observable<T>;

    const cached = this.read<T>();
    const source = cached === undefined
      ? defer(loadFresh).pipe(tap((value) => this.write(value)))
      : of(cached);

    this.cached$ = source.pipe(
      shareReplay({ bufferSize: 1, refCount: false }),
      catchError((error) => { this.cached$ = undefined; throw error; })
    );
    return this.cached$ as Observable<T>;
  }

  clear(): void {
    this.cached$ = undefined;
    try { window.localStorage.removeItem(CACHE_KEY); } catch { /* storage can be unavailable */ }
  }

  requestForceRefresh(): void {
    this.clear();
    this.refreshRequested.update((value) => value + 1);
  }

  private read<T>(): T | undefined {
    try {
      const raw = window.localStorage.getItem(CACHE_KEY);
      if (!raw) return undefined;
      const entry = JSON.parse(raw) as CacheEntry<T>;
      if (!entry || typeof entry.savedAt !== 'number' || Date.now() - entry.savedAt >= CACHE_TTL_MS) {
        window.localStorage.removeItem(CACHE_KEY);
        return undefined;
      }
      return entry.value;
    } catch {
      try { window.localStorage.removeItem(CACHE_KEY); } catch { /* ignore storage errors */ }
      return undefined;
    }
  }

  private write<T>(value: T): void {
    try { window.localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), value } satisfies CacheEntry<T>)); }
    catch { /* storage can be unavailable or full */ }
  }
}
