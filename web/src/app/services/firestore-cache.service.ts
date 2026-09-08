import { Injectable } from '@angular/core';
import { Observable, catchError, defer, of, shareReplay, tap } from 'rxjs';

const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
type CacheKey = 'patches' | 'translators' | 'tags' | 'systems';

interface CacheEntry<T> { savedAt: number; value: T; }

@Injectable({ providedIn: 'root' })
export class FirestoreCacheService {
  private readonly memory = new Map<CacheKey, Observable<unknown>>();

  get<T>(key: CacheKey, loadFresh: () => Observable<T>): Observable<T> {
    const existing = this.memory.get(key);
    if (existing) return existing as Observable<T>;

    const cached = this.read<T>(key);
    const source = cached === undefined
      ? defer(loadFresh).pipe(tap((value) => this.write(key, value)))
      : of(cached);
    const shared = source.pipe(
      shareReplay({ bufferSize: 1, refCount: false }),
      catchError((error) => { this.memory.delete(key); throw error; })
    );
    this.memory.set(key, shared);
    return shared;
  }

  clear(key: CacheKey): void {
    this.memory.delete(key);
    try { window.localStorage.removeItem(this.storageKey(key)); } catch { /* storage can be unavailable */ }
  }

  clearAll(): void {
    (['patches', 'translators', 'tags', 'systems'] as const).forEach((key) => this.clear(key));
  }

  private storageKey(key: CacheKey): string { return `rom-collector:realtime-database:${key}`; }

  private read<T>(key: CacheKey): T | undefined {
    try {
      const raw = window.localStorage.getItem(this.storageKey(key));
      if (!raw) return undefined;
      const entry = JSON.parse(raw) as CacheEntry<T>;
      if (!entry || typeof entry.savedAt !== 'number' || Date.now() - entry.savedAt >= CACHE_TTL_MS) {
        window.localStorage.removeItem(this.storageKey(key));
        return undefined;
      }
      return entry.value;
    } catch {
      try { window.localStorage.removeItem(this.storageKey(key)); } catch { /* ignore storage errors */ }
      return undefined;
    }
  }

  private write<T>(key: CacheKey, value: T): void {
    try { window.localStorage.setItem(this.storageKey(key), JSON.stringify({ savedAt: Date.now(), value } satisfies CacheEntry<T>)); }
    catch { /* storage can be unavailable or full */ }
  }
}

export type { CacheKey };
