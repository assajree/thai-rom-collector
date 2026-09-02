import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, deleteDoc, doc, updateDoc } from '@angular/fire/firestore';
import { Observable, catchError, map, throwError } from 'rxjs';
import { Tag } from '../models/patch.models';
import { RepositoryError } from './repository-error';

const normalizeName = (value: string): string => value.trim().replace(/\s+/g, ' ');

@Injectable({ providedIn: 'root' })
export class TagRepository {
  private readonly firestore = inject(Firestore);
  private readonly tags = collection(this.firestore, 'tags');

  watchAll(): Observable<Tag[]> {
    return collectionData(this.tags, { idField: 'id' }).pipe(
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
      return { id: ref.id, name: normalizedName };
    } catch {
      throw new RepositoryError('ไม่สามารถเพิ่มหมวดหมู่ได้', 'create');
    }
  }
  async update(id: string, name: string): Promise<Tag> {
    const normalizedName = normalizeName(name);
    if (!normalizedName) throw new RepositoryError('กรุณาระบุชื่อหมวดหมู่', 'update');
    try { await updateDoc(doc(this.tags, id), { name: normalizedName }); return { id, name: normalizedName }; }
    catch { throw new RepositoryError('ไม่สามารถแก้ไขหมวดหมู่ได้', 'update'); }
  }
  async delete(id: string): Promise<void> { try { await deleteDoc(doc(this.tags, id)); } catch { throw new RepositoryError('ไม่สามารถลบหมวดหมู่ได้', 'delete'); } }
}
