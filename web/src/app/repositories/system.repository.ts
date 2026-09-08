import { Injectable, inject } from '@angular/core';
import { Firestore, addDoc, collection, deleteDoc, doc, getDocsFromServer, updateDoc } from '@angular/fire/firestore';
import { Observable, Subject, catchError, from, map, startWith, switchMap, throwError } from 'rxjs';
import { FirestoreCacheService } from '../services/firestore-cache.service';
import { RepositoryError } from './repository-error';

export interface SystemMaster { id: string; shortName: string; name: string; }
const normalizeName = (value: string): string => value.trim().replace(/\s+/g, ' ');

@Injectable({ providedIn: 'root' })
export class SystemRepository {
  private readonly systems = collection(inject(Firestore), 'systems');
  private readonly cache = inject(FirestoreCacheService);
  private readonly refresh = new Subject<void>();

  watchAll(): Observable<SystemMaster[]> {
    return this.refresh.pipe(startWith(undefined), switchMap(() => this.cache.get('systems', () => from(getDocsFromServer(this.systems)).pipe(map((snapshot) => snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Record<string, unknown>))))))).pipe(
      map((rows) => rows.map((row) => ({ id: String(row['id']), shortName: normalizeName(String(row['shortName'] ?? '')), name: normalizeName(String(row['name'] ?? '')) }))
        .filter((row) => row.shortName.length > 0 && row.name.length > 0)
        .sort((a, b) => a.name.localeCompare(b.name, 'th', { sensitivity: 'base' }))),
      catchError(() => throwError(() => new RepositoryError('ไม่สามารถโหลดข้อมูลเครื่องเกมได้', 'read')))
    );
  }

  async create(shortName: string, name: string): Promise<SystemMaster> {
    const normalizedShortName = normalizeName(shortName);
    const normalizedName = normalizeName(name);
    if (!normalizedShortName || !normalizedName) throw new RepositoryError('กรุณาระบุชื่อย่อและชื่อเต็มของเครื่องเกม', 'create');
    try {
      const ref = await addDoc(this.systems, { shortName: normalizedShortName, name: normalizedName });
      this.cache.clear('systems'); this.refresh.next();
      return { id: ref.id, shortName: normalizedShortName, name: normalizedName };
    } catch { throw new RepositoryError('ไม่สามารถเพิ่มเครื่องเกมได้', 'create'); }
  }

  async update(id: string, shortName: string, name: string): Promise<SystemMaster> {
    const normalizedShortName = normalizeName(shortName);
    const normalizedName = normalizeName(name);
    if (!normalizedShortName || !normalizedName) throw new RepositoryError('กรุณาระบุชื่อย่อและชื่อเต็มของเครื่องเกม', 'update');
    try {
      await updateDoc(doc(this.systems, id), { shortName: normalizedShortName, name: normalizedName }); this.cache.clear('systems'); this.refresh.next();
      return { id, shortName: normalizedShortName, name: normalizedName };
    } catch { throw new RepositoryError('ไม่สามารถแก้ไขเครื่องเกมได้', 'update'); }
  }

  async delete(id: string): Promise<void> {
    try { await deleteDoc(doc(this.systems, id)); this.cache.clear('systems'); this.refresh.next(); }
    catch { throw new RepositoryError('ไม่สามารถลบเครื่องเกมได้', 'delete'); }
  }
}
