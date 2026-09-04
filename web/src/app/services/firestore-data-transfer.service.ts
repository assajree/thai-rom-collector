import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, getDocsFromServer, setDoc, writeBatch } from '@angular/fire/firestore';
import { Patch } from '../models/patch.models';
import { PatchCacheService } from './patch-cache.service';

export const FIRESTORE_BACKUP_COLLECTIONS = ['patches', 'translators', 'tags', 'systems'] as const;
export type FirestoreBackupCollection = typeof FIRESTORE_BACKUP_COLLECTIONS[number];
export type FirestoreBackup = { version: 1; exportedAt: string; collections: Record<FirestoreBackupCollection, BackupDocument[]> };
export type BackupDocument = { id: string; [key: string]: unknown };
export type ImportResult = { written: number; failed: Array<{ collection: string; id: string; reason: string }> };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

@Injectable({ providedIn: 'root' })
export class FirestoreDataTransferService {
  private readonly firestore = inject(Firestore);
  private readonly patchCache = inject(PatchCacheService);

  async exportBackup(): Promise<FirestoreBackup> {
    const collections = {} as FirestoreBackup['collections'];
    for (const name of FIRESTORE_BACKUP_COLLECTIONS) {
      const snapshot = await getDocsFromServer(collection(this.firestore, name));
      collections[name] = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    }
    return { version: 1, exportedAt: new Date().toISOString(), collections };
  }

  parseBackup(raw: string): FirestoreBackup {
    let value: unknown;
    try { value = JSON.parse(raw); } catch { throw new Error('ไฟล์ JSON ไม่ถูกต้องหรืออ่านไม่ได้'); }
    if (!isRecord(value) || value['version'] !== 1 || !isRecord(value['collections'])) throw new Error('รูปแบบไฟล์ backup ไม่รองรับ');
    const collections = {} as FirestoreBackup['collections'];
    for (const name of FIRESTORE_BACKUP_COLLECTIONS) {
      const rows = value['collections'][name];
      if (!Array.isArray(rows)) throw new Error(`ไม่พบข้อมูล collection ${name} ในไฟล์ backup`);
      const ids = new Set<string>();
      collections[name] = rows.map((row, index) => {
        if (!isRecord(row) || typeof row['id'] !== 'string' || !row['id'].trim()) throw new Error(`${name}[${index}] ต้องมี id เป็นข้อความ`);
        if (ids.has(row['id'])) throw new Error(`พบ document ID ซ้ำใน ${name}: ${row['id']}`);
        ids.add(row['id']);
        const document = row as BackupDocument;
        this.validateDocument(name, document, index);
        return document;
      });
    }
    const unknown = Object.keys(value['collections']).filter((key) => !(FIRESTORE_BACKUP_COLLECTIONS as readonly string[]).includes(key));
    if (unknown.length) throw new Error(`พบ collection ที่ไม่อนุญาต: ${unknown.join(', ')}`);
    return { version: 1, exportedAt: typeof value['exportedAt'] === 'string' ? value['exportedAt'] : '', collections };
  }

  async importBackup(backup: FirestoreBackup): Promise<ImportResult> {
    const result: ImportResult = { written: 0, failed: [] };
    for (const name of FIRESTORE_BACKUP_COLLECTIONS) {
      const rows = backup.collections[name];
      for (let start = 0; start < rows.length; start += 500) {
        const chunk = rows.slice(start, start + 500);
        const batch = writeBatch(this.firestore);
        chunk.forEach((row) => batch.set(doc(this.firestore, name, row.id), this.documentWithoutId(row), { merge: true }));
        try { await batch.commit(); result.written += chunk.length; }
        catch (error) { const reason = this.userError(error); chunk.forEach((row) => result.failed.push({ collection: name, id: row.id, reason })); }
      }
    }
    if (result.written) this.patchCache.requestForceRefresh();
    return result;
  }

  private documentWithoutId(row: BackupDocument): Record<string, unknown> { const { id: _id, ...data } = row; return data; }

  private validateDocument(name: FirestoreBackupCollection, row: BackupDocument, index: number): void {
    const fail = (field: string) => { throw new Error(`${name}[${index}].${field} มีชนิดข้อมูลไม่ถูกต้อง`); };
    if (name === 'patches') {
      for (const field of ['updateDate','fileName','gameTitle','system','translatorId','translatedBy','patchTool','coverUrl','patchFileUrl','patchedRomUrl','referenceText','referenceUrl']) if (typeof row[field] !== 'string') fail(field);
      if (!Array.isArray(row['tags']) || !row['tags'].every((tag) => typeof tag === 'string')) fail('tags');
      if (typeof row['haveRom'] !== 'boolean') fail('haveRom');
    } else if (name === 'tags') { if (typeof row['name'] !== 'string') fail('name'); }
    else if (name === 'systems' || name === 'translators') {
      for (const field of ['shortName', 'name']) if (typeof row[field] !== 'string') fail(field);
      for (const field of name === 'translators' ? ['modTool', 'link'] : []) if (row[field] !== undefined && typeof row[field] !== 'string') fail(field);
    }
  }

  private userError(error: unknown): string {
    const code = isRecord(error) ? String(error['code'] ?? '') : '';
    return code.includes('permission-denied') ? 'ไม่มีสิทธิ์เขียนข้อมูล กรุณาตรวจสอบบัญชี admin' : 'ไม่สามารถเขียนข้อมูลชุดนี้ได้';
  }
}
