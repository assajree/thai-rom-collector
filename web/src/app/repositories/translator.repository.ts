import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, deleteDoc, doc, getDocsFromServer, updateDoc } from '@angular/fire/firestore';
import { Observable, Subject, catchError, from, map, startWith, switchMap, throwError } from 'rxjs';
import { Tag, Translator } from '../models/patch.models';
import { RepositoryError } from './repository-error';
import { FirestoreCacheService } from '../services/firestore-cache.service';

type TranslatorDocument = { shortName: string; name: string; modTool?: string; link?: string };

const normalizeName = (value: string): string => value.trim().replace(/\s+/g, ' ');

@Injectable({ providedIn: 'root' })
export class TranslatorRepository {
  private readonly firestore = inject(Firestore);
  private readonly translators = collection(this.firestore, 'translators');
  private readonly cache = inject(FirestoreCacheService);
  private readonly refresh = new Subject<void>();

  watchAll(): Observable<Translator[]> {
    return this.refresh.pipe(startWith(undefined), switchMap(() => this.cache.get('translators', () => from(getDocsFromServer(this.translators)).pipe(map((snapshot) => snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Record<string, unknown>))))))).pipe(
      map((rows) => rows
        .map((row) => ({ id: String(row['id']), shortName: normalizeName(String(row['shortName'] ?? '')), name: normalizeName(String(row['name'] ?? '')), modTool: row['modTool'] ? normalizeName(String(row['modTool'])) : undefined, link: row['link'] ? String(row['link']).trim() : undefined }))
        .filter((row) => row.shortName.length > 0 && row.name.length > 0)
        .sort((a, b) => a.name.localeCompare(b.name, 'th', { sensitivity: 'base' }))),
      catchError(() => throwError(() => new RepositoryError('ไม่สามารถโหลดข้อมูลทีมแปลได้', 'read')))
    );
  }

  async create(shortName: string, name: string, link?: string, modTool?: string): Promise<Translator> {
    const normalizedShortName = normalizeName(shortName);
    const normalizedName = normalizeName(name);
    const normalizedLink = link?.trim(); const normalizedModTool = modTool?.trim();
    if (!normalizedShortName || !normalizedName) throw new RepositoryError('กรุณาระบุชื่อย่อและชื่อเต็มของทีมแปล', 'create');
    try {
      const data: TranslatorDocument = { shortName: normalizedShortName, name: normalizedName, ...(normalizedModTool ? { modTool: normalizedModTool } : {}), ...(normalizedLink ? { link: normalizedLink } : {}) };
      const ref = await addDoc(this.translators, data);
      this.cache.clear('translators'); this.refresh.next();
      return { id: ref.id, shortName: normalizedShortName, name: normalizedName, ...(normalizedModTool ? { modTool: normalizedModTool } : {}), ...(normalizedLink ? { link: normalizedLink } : {}) };
    } catch {
      throw new RepositoryError('ไม่สามารถเพิ่มทีมแปลได้', 'create');
    }
  }
  async update(id: string, shortName: string, name: string, link?: string, modTool?: string): Promise<Translator> {
    const normalizedShortName = normalizeName(shortName); const normalizedName = normalizeName(name); const normalizedLink = link?.trim(); const normalizedModTool = modTool?.trim();
    if (!normalizedShortName || !normalizedName) throw new RepositoryError('กรุณาระบุชื่อย่อและชื่อเต็มของทีมแปล', 'update');
    try {
      const data: TranslatorDocument = { shortName: normalizedShortName, name: normalizedName, ...(normalizedModTool ? { modTool: normalizedModTool } : {}), ...(normalizedLink ? { link: normalizedLink } : {}) };
      await updateDoc(doc(this.translators, id), data); this.cache.clear('translators'); this.refresh.next(); return { id, shortName: normalizedShortName, name: normalizedName, ...(normalizedModTool ? { modTool: normalizedModTool } : {}), ...(normalizedLink ? { link: normalizedLink } : {}) };
    } catch { throw new RepositoryError('ไม่สามารถแก้ไขทีมแปลได้', 'update'); }
  }
  async delete(id: string): Promise<void> { try { await deleteDoc(doc(this.translators, id)); this.cache.clear('translators'); this.refresh.next(); } catch { throw new RepositoryError('ไม่สามารถลบทีมแปลได้', 'delete'); } }
}

export type { TranslatorDocument };
