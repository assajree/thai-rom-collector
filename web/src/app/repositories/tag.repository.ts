import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, deleteDoc, doc, getDocsFromServer, updateDoc } from '@angular/fire/firestore';
import { Observable, Subject, catchError, from, map, startWith, switchMap, throwError } from 'rxjs';
import { Tag } from '../models/patch.models';
import { RepositoryError } from './repository-error';
import { FirestoreCacheService } from '../services/firestore-cache.service';

const normalizeName = (value: string): string => value.trim().replace(/\s+/g, ' ');

@Injectable({ providedIn: 'root' })
export class TagRepository {
  private readonly firestore = inject(Firestore);
  private readonly tags = collection(this.firestore, 'tags');
  private readonly cache = inject(FirestoreCacheService);
  private readonly refresh = new Subject<void>();

  watchAll(): Observable<Tag[]> {
    return this.refresh.pipe(startWith(undefined), switchMap(() => this.cache.get('tags', () => from(getDocsFromServer(this.tags)).pipe(map((snapshot) => snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Record<string, unknown>))))))).pipe(
      map((rows) => rows
        .map((row) => ({ id: String(row['id']), name: normalizeName(String(row['name'] ?? '')) }))
        .filter((row) => row.name.length > 0)
        .sort((a, b) => a.name.localeCompare(b.name, 'th', { sensitivity: 'base' }))),
      catchError(() => throwError(() => new RepositoryError('ไม่สามารถโหลดข้อมูลหมวดหมู่ได้', 'read')))
    );
  }

  async create(name: string): Promise<Tag> {
    const normalizedName = normalizeName(name);
    if (!normalizedName) throw new RepositoryError('กรุณาระบุชื่อหมวดหมู่', 'create');
    try {
      const ref = await addDoc(this.tags, { name: normalizedName });
      this.cache.clear('tags'); this.refresh.next();
      return { id: ref.id, name: normalizedName };
    } catch {
      throw new RepositoryError('ไม่สามารถเพิ่มหมวดหมู่ได้', 'create');
    }
  }
  async update(id: string, name: string): Promise<Tag> {
    const normalizedName = normalizeName(name);
    if (!normalizedName) throw new RepositoryError('กรุณาระบุชื่อหมวดหมู่', 'update');
    try { await updateDoc(doc(this.tags, id), { name: normalizedName }); this.cache.clear('tags'); this.refresh.next(); return { id, name: normalizedName }; }
    catch { throw new RepositoryError('ไม่สามารถแก้ไขหมวดหมู่ได้', 'update'); }
  }
  async delete(id: string): Promise<void> { try { await deleteDoc(doc(this.tags, id)); this.cache.clear('tags'); this.refresh.next(); } catch { throw new RepositoryError('ไม่สามารถลบหมวดหมู่ได้', 'delete'); } }
}
