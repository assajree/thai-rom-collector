import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc } from '@angular/fire/firestore';
import { Observable, catchError, map, throwError } from 'rxjs';
import { Tag, Translator } from '../models/patch.models';
import { RepositoryError } from './repository-error';

type TranslatorDocument = { name: string; link?: string };

const normalizeName = (value: string): string => value.trim().replace(/\s+/g, ' ');

@Injectable({ providedIn: 'root' })
export class TranslatorRepository {
  private readonly firestore = inject(Firestore);
  private readonly translators = collection(this.firestore, 'translators');

  watchAll(): Observable<Translator[]> {
    return collectionData(this.translators, { idField: 'id' }).pipe(
      map((rows) => rows
        .map((row) => ({ id: String(row['id']), name: normalizeName(String(row['name'] ?? '')), link: row['link'] ? String(row['link']).trim() : undefined }))
        .filter((row) => row.name.length > 0)
        .sort((a, b) => a.name.localeCompare(b.name, 'th', { sensitivity: 'base' }))),
      catchError(() => throwError(() => new RepositoryError('ไม่สามารถโหลดข้อมูลทีมแปลได้', 'read')))
    );
  }

  async create(name: string, link?: string): Promise<Translator> {
    const normalizedName = normalizeName(name);
    const normalizedLink = link?.trim();
    if (!normalizedName) throw new RepositoryError('กรุณาระบุชื่อทีมแปล', 'create');
    try {
      const data: TranslatorDocument = normalizedLink ? { name: normalizedName, link: normalizedLink } : { name: normalizedName };
      const ref = await addDoc(this.translators, data);
      return { id: ref.id, name: normalizedName, ...(normalizedLink ? { link: normalizedLink } : {}) };
    } catch {
      throw new RepositoryError('ไม่สามารถเพิ่มทีมแปลได้', 'create');
    }
  }
}

export type { TranslatorDocument };
