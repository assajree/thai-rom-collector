import { Injectable } from '@angular/core';
import { ProcessedCover } from '../models/patch.models';

@Injectable({ providedIn: 'root' })
export class ImageProcessorService {
  async process(source: Blob): Promise<ProcessedCover> {
    if (!source.type.startsWith('image/')) throw new Error('ไฟล์ที่เลือกต้องเป็นรูปภาพ');
    const image = await this.decode(source);
    const scale = Math.min(1, 250 / image.width, 250 / image.height);
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    canvas.getContext('2d')?.drawImage(image, 0, 0, width, height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error('ไม่สามารถแปลงรูปภาพได้')), 'image/png'));
    return { blob, width, height, filename: `cover_max250px_${Date.now()}.png` };
  }

  private decode(source: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image(); const url = URL.createObjectURL(source);
      image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
      image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('ไม่สามารถอ่านรูปภาพได้')); };
      image.src = url;
    });
  }
}
