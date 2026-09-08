import { Injectable, inject } from '@angular/core';
import { Database, get, push, ref, remove, update } from '@angular/fire/database';
import { Observable, Subject, catchError, from, map, startWith, switchMap, throwError } from 'rxjs';
import { Tag } from '../models/patch.models';
import { RepositoryError } from './repository-error';
import { FirestoreCacheService } from '../services/firestore-cache.service';
const normalizeName = (value: string): string => value.trim().replace(/\s+/g, ' ');
const rows = (value: unknown): Record<string, unknown>[] => Object.entries((value && typeof value === 'object' ? value : {}) as Record<string, unknown>).map(([id, data]) => ({ id, ...(data as Record<string, unknown>) } as Record<string, unknown>));
@Injectable({ providedIn: 'root' }) export class TagRepository {
  private readonly database = inject(Database); private readonly cache = inject(FirestoreCacheService); private readonly refresh = new Subject<void>();
  watchAll(): Observable<Tag[]> { return this.refresh.pipe(startWith(undefined), switchMap(() => this.cache.get('tags', () => from(get(ref(this.database, 'tags'))).pipe(map(s => rows(s.val())))))).pipe(map(items => items.map(row => ({ id: String(row['id']), name: normalizeName(String(row['name'] ?? '')) })).filter(row => row.name).sort((a,b) => a.name.localeCompare(b.name, 'th', { sensitivity: 'base' }))), catchError(() => throwError(() => new RepositoryError('ไม่สามารถโหลดข้อมูลหมวดหมู่ได้', 'read')))); }
  async create(name: string): Promise<Tag> { const n = normalizeName(name); if (!n) throw new RepositoryError('กรุณาระบุชื่อหมวดหมู่', 'create'); try { const r = push(ref(this.database, 'tags')); await update(r, { name: n }); this.cache.clear('tags'); this.refresh.next(); return { id: r.key!, name: n }; } catch { throw new RepositoryError('ไม่สามารถเพิ่มหมวดหมู่ได้', 'create'); } }
  async update(id: string, name: string): Promise<Tag> { const n = normalizeName(name); if (!n) throw new RepositoryError('กรุณาระบุชื่อหมวดหมู่', 'update'); try { await update(ref(this.database, `tags/${id}`), { name: n }); this.cache.clear('tags'); this.refresh.next(); return { id, name: n }; } catch { throw new RepositoryError('ไม่สามารถแก้ไขหมวดหมู่ได้', 'update'); } }
  refreshAll(): void { this.cache.clear('tags'); this.refresh.next(); }
  async delete(id: string): Promise<void> { try { await remove(ref(this.database, `tags/${id}`)); this.cache.clear('tags'); this.refresh.next(); } catch { throw new RepositoryError('ไม่สามารถลบหมวดหมู่ได้', 'delete'); } }
}
