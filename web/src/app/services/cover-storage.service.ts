import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Storage } from '@angular/fire/storage';
import { deleteObject, ref as firebaseRef } from 'firebase/storage';
import { firstValueFrom } from 'rxjs';
import { RepositoryError } from '../repositories/repository-error';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CoverStorageService {
  private readonly storage = inject(Storage);
  private readonly http = inject(HttpClient);
  private readonly workerUrl = environment.r2?.workerUrl;
  private readonly workerSecret = environment.r2?.secret;

  async upload(patchId: string, blob: Blob, filename: string): Promise<string> {
    if (!patchId || blob.type !== 'image/png' || !filename.match(/^cover_max250px_[0-9]+\.png$/)) throw new RepositoryError('ไฟล์ปกไม่ถูกต้อง', 'create');
    
    if (!this.workerUrl || !this.workerSecret) {
      throw new RepositoryError('ระบบอัปโหลดรูปภาพยังไม่ได้ตั้งค่า', 'create');
    }

    try {
      const formData = new FormData();
      formData.append('file', blob, filename);
      formData.append('patchId', patchId);

      const headers = new HttpHeaders().set('Authorization', `Bearer ${this.workerSecret}`);

      const res = await firstValueFrom(
        this.http.post<{ url: string }>(`${this.workerUrl}/upload`, formData, { headers })
      );
      
      if (!res?.url) throw new Error('No URL returned from worker');
      return res.url;
    } catch (e) {
      console.error('Upload failed:', e);
      throw new RepositoryError('ไม่สามารถอัปโหลดรูปปกได้', 'create');
    }
  }

  async remove(downloadUrl: string): Promise<void> {
    if (!downloadUrl) return;

    // หากเป็นรูปที่อยู่ใน Firebase Storage เดิม
    if (this.belongsToCurrentBucket(downloadUrl)) {
      try {
        await deleteObject(firebaseRef(this.storage, downloadUrl));
      } catch (e) {
        console.error('Delete from Firebase failed:', e);
        throw new RepositoryError('ไม่สามารถลบรูปปกเก่าได้', 'update');
      }
      return;
    }

    // หากเป็นรูปที่อยู่ใน Cloudflare R2
    if (this.belongsToR2(downloadUrl)) {
      if (!this.workerUrl || !this.workerSecret) return;

      try {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${this.workerSecret}`);
        await firstValueFrom(
          this.http.delete(`${this.workerUrl}/delete`, { 
            headers,
            body: { url: downloadUrl } 
          })
        );
      } catch (e) {
        console.error('Delete from R2 failed:', e);
        throw new RepositoryError('ไม่สามารถลบรูปปกเก่าได้', 'update');
      }
    }
  }

  private belongsToCurrentBucket(downloadUrl: string): boolean {
    try {
      const url = new URL(downloadUrl);
      const bucket = this.storage.app.options.storageBucket;
      return Boolean(bucket) && url.hostname === 'firebasestorage.googleapis.com' &&
        decodeURIComponent(url.pathname).startsWith(`/v0/b/${bucket}/o/covers/`);
    } catch {
      return false;
    }
  }

  private belongsToR2(downloadUrl: string): boolean {
    try {
      const url = new URL(downloadUrl);
      const r2PublicUrl = environment.r2?.publicUrl;
      if (!r2PublicUrl) return false;
      
      const r2UrlObj = new URL(r2PublicUrl);
      return url.hostname === r2UrlObj.hostname;
    } catch {
      return false;
    }
  }
}
