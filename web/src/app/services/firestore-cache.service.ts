import { Injectable, signal } from '@angular/core';
import { Observable, catchError, defer, of, shareReplay, tap } from 'rxjs';

const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
type CacheKey = 'patches' | 'translators' | 'tags' | 'systems';

interface CacheEntry<T> { savedAt: number; value: T; }
type CacheTimestamps = Record<CacheKey, number | null>;

@Injectable({ providedIn: 'root' })
export class FirestoreCacheService {
  private readonly memory = new Map<CacheKey, Observable<unknown>>();
  private readonly timestamps = signal<CacheTimestamps>({ patches: null, translators: null, tags: null, systems: null });

  timestamp(key: CacheKey): number | null {
    const current = this.timestamps()[key];
    if (current !== null) return current;
    const entry = this.readEntry<unknown>(key);
    if (entry) {
      this.timestamps.update((timestamps) => ({ ...timestamps, [key]: entry.savedAt }));
      return entry.savedAt;
    }
    return null;
  }

  timestampSignal(key: CacheKey) {
    return () => this.timestamps()[key];
  }

  get<T>(key: CacheKey, loadFresh: () => Observable<T>): Observable<T> {
    const existing = this.memory.get(key);
    if (existing) return existing as Observable<T>;

    const cachedEntry = this.readEntry<T>(key);
    const cached = cachedEntry?.value;
    if (cachedEntry) this.timestamps.update((timestamps) => ({ ...timestamps, [key]: cachedEntry.savedAt }));
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
    this.timestamps.update((timestamps) => ({ ...timestamps, [key]: null }));
  }

  clearAll(): void {
    (['patches', 'translators', 'tags', 'systems'] as const).forEach((key) => this.clear(key));
  }

  private storageKey(key: CacheKey): string { return `rom-collector:realtime-database:${key}`; }

  private readEntry<T>(key: CacheKey): CacheEntry<T> | undefined {
    try {
      const raw = window.localStorage.getItem(this.storageKey(key));
      if (!raw) return undefined;
      const entry = JSON.parse(raw) as CacheEntry<T>;
      if (!entry || typeof entry.savedAt !== 'number' || Date.now() - entry.savedAt >= CACHE_TTL_MS) {
        window.localStorage.removeItem(this.storageKey(key));
        return undefined;
      }
      return entry;
    } catch {
      try { window.localStorage.removeItem(this.storageKey(key)); } catch { /* ignore storage errors */ }
      return undefined;
    }
  }

  private write<T>(key: CacheKey, value: T): void {
    const savedAt = Date.now();
    this.timestamps.update((timestamps) => ({ ...timestamps, [key]: savedAt }));
    try { window.localStorage.setItem(this.storageKey(key), JSON.stringify({ savedAt, value } satisfies CacheEntry<T>)); }
    catch { /* storage can be unavailable or full */ }
  }
}

export type { CacheKey };
