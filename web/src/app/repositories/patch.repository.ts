import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, deleteDoc, doc, docData, getDocsFromServer, setDoc } from '@angular/fire/firestore';
import { Observable, catchError, from, map, throwError } from 'rxjs';
import { Patch, PatchDraft, Translator, Tag } from '../models/patch.models';
import { RepositoryError } from './repository-error';
import { PatchCacheService } from '../services/patch-cache.service';

type PatchDocument = Omit<Patch, 'id'>;

const clean = (value: string): string => value.trim().replace(/\s+/g, ' ');

@Injectable({ providedIn: 'root' })
export class PatchRepository {
  private readonly firestore = inject(Firestore);
  private readonly patchCache = inject(PatchCacheService);
  private readonly patches = collection(this.firestore, 'patches');
  private readonly translators = collection(this.firestore, 'translators');
  private readonly tags = collection(this.firestore, 'tags');
  private readonly systems = collection(this.firestore, 'systems');

  watchAll(): Observable<Patch[]> {
    return this.patchCache.get(() => from(getDocsFromServer(this.patches)).pipe(map((snapshot) => snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Record<string, unknown>))))).pipe(
      map((rows) => rows.map((row) => ({
        id: String(row['id']),
        updateDate: String(row['updateDate'] ?? ''),
        fileName: String(row['fileName'] ?? ''),
        gameTitle: String(row['gameTitle'] ?? ''),
        system: String(row['system'] ?? ''),
        translatorId: String(row['translatorId'] ?? ''),
        translatedBy: String(row['translatedBy'] ?? ''),
        patchTool: String(row['patchTool'] ?? ''),
        tags: Array.isArray(row['tags']) ? row['tags'].map(String) : [],
        coverUrl: String(row['coverUrl'] ?? ''),
        patchFileUrl: String(row['patchFileUrl'] ?? ''),
        haveRom: Boolean(row['haveRom'] ?? false),
        patchedRomUrl: String(row['patchedRomUrl'] ?? ''),
        referenceText: String(row['referenceText'] ?? ''),
        referenceUrl: String(row['referenceUrl'] ?? '')
      }))),
      catchError(() => throwError(() => new RepositoryError('ไม่สามารถโหลดรายการแพตช์ได้', 'read')))
    );
  }

  clearCache(): void { this.patchCache.clear(); }

  getById(id: string): Promise<Patch | undefined> {
    return new Promise((resolve, reject) => {
      docData(doc(this.patches, id), { idField: 'id' }).pipe(
        map((row) => row ? ({ ...row, id: String(row['id']) } as unknown as Patch) : undefined),
        catchError(() => throwError(() => new RepositoryError('ไม่สามารถโหลดข้อมูลแพตช์ได้', 'read')))
      ).subscribe({ next: resolve, error: reject, complete: () => resolve(undefined) });
    });
  }

  async create(draft: PatchDraft, coverUrl: string, id?: string): Promise<string> {
    const ref = id ? doc(this.patches, id) : doc(this.patches);
    const data = await this.buildDocument(draft, coverUrl, draft.updateDate);
    try {
      await setDoc(ref, data);
      return ref.id;
    } catch (error) {
      if (this.isPermissionDenied(error)) {
        throw new RepositoryError('ไม่มีสิทธิ์บันทึกแพตช์: ตรวจสอบว่า UID นี้อยู่ใน admins และ deploy Firestore Rules แล้ว', 'create');
      }
      throw new RepositoryError('ไม่สามารถบันทึกแพตช์ได้', 'create');
    }
  }

  private isPermissionDenied(error: unknown): boolean {
    return typeof error === 'object' && error !== null &&
      String((error as { code?: unknown }).code ?? '').toLowerCase().includes('permission-denied');
  }

  async update(id: string, draft: PatchDraft, coverUrl?: string): Promise<void> {
    try {
      const existing = await this.getById(id);
      if (!existing) throw new RepositoryError('ไม่พบแพตช์ที่ต้องการแก้ไข', 'update');
      const data = await this.buildDocument(draft, coverUrl ?? existing.coverUrl, draft.updateDate || existing.updateDate);
      await setDoc(doc(this.patches, id), data);
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      if (this.isPermissionDenied(error)) {
        throw new RepositoryError('ไม่มีสิทธิ์แก้ไขแพตช์: ตรวจสอบว่า UID นี้อยู่ใน admins และ deploy Firestore Rules แล้ว', 'update');
      }
      throw new RepositoryError('ไม่สามารถแก้ไขแพตช์ได้', 'update');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(this.patches, id));
      this.patchCache.requestForceRefresh();
    } catch (error) {
      if (this.isPermissionDenied(error)) {
        throw new RepositoryError('ไม่มีสิทธิ์ลบแพตช์: ตรวจสอบว่า UID นี้อยู่ใน admins และ deploy Firestore Rules แล้ว', 'delete');
      }
      throw new RepositoryError('ไม่สามารถลบแพตช์ได้', 'delete');
    }
  }

  private async buildDocument(draft: PatchDraft, coverUrl: string, updateDate: string): Promise<PatchDocument> {
    const translator = await this.getTranslator(draft.translatorId);
    const system = await this.getSystem(draft.system);
    const tags = await this.getMasterTags(draft.tags);
    const fields = [draft.fileName, draft.gameTitle, draft.system];
    if (fields.some((field) => !clean(field))) throw new RepositoryError('ข้อมูลแพตช์ไม่ครบถ้วน', 'create');
    return {
      updateDate, fileName: clean(draft.fileName), gameTitle: clean(draft.gameTitle), system: system.shortName,
      translatorId: translator.id, translatedBy: translator.name, patchTool: clean(draft.patchTool),
      tags, coverUrl: coverUrl.trim(), patchFileUrl: draft.patchFileUrl.trim(), haveRom: draft.haveRom,
      patchedRomUrl: draft.patchedRomUrl.trim(), referenceText: clean(draft.referenceText), referenceUrl: draft.referenceUrl.trim()
    };
  }

  private getSystem(name: string): Promise<{ shortName: string }> {
    const normalized = clean(name);
    return new Promise((resolve, reject) => {
      collectionData(this.systems).subscribe({
        next: (rows) => {
          const row = rows.find((item) => {
            const shortName = clean(String(item['shortName'] ?? '')).toLocaleLowerCase('th');
            const fullName = clean(String(item['name'] ?? '')).toLocaleLowerCase('th');
            return shortName === normalized.toLocaleLowerCase('th') || fullName === normalized.toLocaleLowerCase('th');
          });
          row ? resolve({ shortName: clean(String(row['shortName'])) }) : reject(new RepositoryError('ไม่พบเครื่องเกมที่เลือก', 'create'));
        },
        error: () => reject(new RepositoryError('ไม่สามารถตรวจสอบเครื่องเกมได้', 'create'))
      });
    });
  }

  private getTranslator(id: string): Promise<Translator> {
    return new Promise((resolve, reject) => {
      docData(doc(this.translators, id), { idField: 'id' }).subscribe({
        next: (row) => row ? resolve({ id, shortName: clean(String((row as Record<string, unknown>)['shortName'] ?? '')), name: clean(String((row as Record<string, unknown>)['name'] ?? '')) }) : reject(new RepositoryError('ไม่พบทีมแปลที่เลือก', 'create')),
        error: () => reject(new RepositoryError('ไม่สามารถตรวจสอบทีมแปลได้', 'create'))
      });
    });
  }

  private getMasterTags(idsOrNames: string[]): Promise<string[]> {
    return new Promise((resolve, reject) => {
      collectionData(this.tags, { idField: 'id' }).subscribe({
        next: (rows) => {
          const selected = new Set(idsOrNames);
          const names = rows.filter((row) => selected.has(String(row['id'])) || selected.has(String(row['name'])))
            .map((row) => clean(String(row['name'] ?? ''))).filter(Boolean);
          resolve([...new Set(names)]);
        },
        error: () => reject(new RepositoryError('ไม่สามารถตรวจสอบหมวดหมู่ได้', 'create'))
      });
    });
  }
}
