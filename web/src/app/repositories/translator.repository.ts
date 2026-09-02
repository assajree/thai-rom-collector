import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc } from '@angular/fire/firestore';
import { Observable, catchError, map, throwError } from 'rxjs';
import { Tag, Translator } from '../models/patch.models';
import { RepositoryError } from './repository-error';

type TranslatorDocument = { shortName: string; name: string; link?: string };

const normalizeName = (value: string): string => value.trim().replace(/\s+/g, ' ');

@Injectable({ providedIn: 'root' })
export class TranslatorRepository {
  private readonly firestore = inject(Firestore);
  private readonly translators = collection(this.firestore, 'translators');

  watchAll(): Observable<Translator[]> {
    return collectionData(this.translators, { idField: 'id' }).pipe(
      map((rows) => rows
        .map((row) => ({ id: String(row['id']), shortName: normalizeName(String(row['shortName'] ?? '')), name: normalizeName(String(row['name'] ?? '')), link: row['link'] ? String(row['link']).trim() : undefined }))
        .filter((row) => row.shortName.length > 0 && row.name.length > 0)
        .sort((a, b) => a.name.localeCompare(b.name, 'th', { sensitivity: 'base' }))),
      catchError(() => throwError(() => new RepositoryError('ไม่สามารถโหลดข้อมูลทีมแปลได้', 'read')))
    );
  }

  async create(shortName: string, name: string, link?: string): Promise<Translator> {
    const normalizedShortName = normalizeName(shortName);
    const normalizedName = normalizeName(name);
    const normalizedLink = link?.trim();
    if (!normalizedShortName || !normalizedName) throw new RepositoryError('กรุณาระบุชื่อย่อและชื่อเต็มของทีมแปล', 'create');
    try {
      const data: TranslatorDocument = normalizedLink ? { shortName: normalizedShortName, name: normalizedName, link: normalizedLink } : { shortName: normalizedShortName, name: normalizedName };
      const ref = await addDoc(this.translators, data);
      return { id: ref.id, shortName: normalizedShortName, name: normalizedName, ...(normalizedLink ? { link: normalizedLink } : {}) };
    } catch {
      throw new RepositoryError('ไม่สามารถเพิ่มทีมแปลได้', 'create');
    }
  }
}

export type { TranslatorDocument };
