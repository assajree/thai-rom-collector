import { Injectable, inject } from '@angular/core';
import { Storage, getDownloadURL, ref, uploadBytes } from '@angular/fire/storage';
import { deleteObject, ref as firebaseRef } from 'firebase/storage';
import { RepositoryError } from '../repositories/repository-error';

@Injectable({ providedIn: 'root' })
export class CoverStorageService {
  private readonly storage = inject(Storage);

  async upload(patchId: string, blob: Blob, filename: string): Promise<string> {
    if (!patchId || blob.type !== 'image/png' || !filename.match(/^cover_max250px_[0-9]+\.png$/)) throw new RepositoryError('ไฟล์ปกไม่ถูกต้อง', 'create');
    try {
      const coverRef = ref(this.storage, `covers/${patchId}/${filename}`);
      await uploadBytes(coverRef, blob, {
        contentType: 'image/png',
        cacheControl: 'public,max-age=31536000,immutable'
      });
      return await getDownloadURL(coverRef);
    } catch {
      throw new RepositoryError('ไม่สามารถอัปโหลดรูปปกได้', 'create');
    }
  }

  async remove(downloadUrl: string): Promise<void> {
    if (!downloadUrl) return;
    try {
      await deleteObject(firebaseRef(this.storage, downloadUrl));
    } catch {
      throw new RepositoryError('ไม่สามารถลบรูปปกเก่าได้', 'update');
    }
  }
}
