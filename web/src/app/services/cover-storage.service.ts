import { Injectable, inject } from '@angular/core';
import { Storage, getDownloadURL, ref, uploadBytes } from '@angular/fire/storage';
import { RepositoryError } from '../repositories/repository-error';

@Injectable({ providedIn: 'root' })
export class CoverStorageService {
  private readonly storage = inject(Storage);

  async upload(patchId: string, blob: Blob, filename: string): Promise<string> {
    if (!patchId || blob.type !== 'image/png') throw new RepositoryError('ไฟล์ปกไม่ถูกต้อง', 'create');
    try {
      const coverRef = ref(this.storage, `covers/${patchId}/${filename}`);
      await uploadBytes(coverRef, blob, { contentType: 'image/png' });
      return await getDownloadURL(coverRef);
    } catch {
      throw new RepositoryError('ไม่สามารถอัปโหลดรูปปกได้', 'create');
    }
  }
}
