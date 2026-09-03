import { Component, EventEmitter, HostListener, Input, Output, inject, signal } from '@angular/core';
import { ImageProcessorService } from '../services/image-processor.service';

@Component({
  selector: 'app-cover-input',
  standalone: true,
  templateUrl: './cover-input.component.html',
  styleUrl: './cover-input.component.css'
})
export class CoverInputComponent {
  @Input() gameTitle = '';
  @Output() selected = new EventEmitter<Blob>();
  private readonly processor = inject(ImageProcessorService);
  protected readonly preview = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  protected async select(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) await this.process(file);
  }

  protected async readFromClipboard(): Promise<void> {
    this.error.set(null);

    try {
      if (!navigator.clipboard?.read) {
        throw new Error('เบราว์เซอร์นี้ไม่รองรับการดึงรูปจาก Clipboard');
      }

      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((type) => type.startsWith('image/'));
        if (imageType) {
          await this.process(await item.getType(imageType));
          return;
        }
      }

      throw new Error('ไม่พบรูปภาพใน Clipboard');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'ไม่สามารถอ่านรูปจาก Clipboard ได้');
    }
  }

  protected searchCoverImage(): void {
    const title = this.gameTitle.trim();
    if (!title) {
      this.error.set('กรุณาระบุชื่อเกมก่อนค้นหารูปภาพ');
      return;
    }
    const query = encodeURIComponent(`${title} box art launchbox`);
    window.open(`https://www.google.com/search?tbm=isch&q=${query}`, '_blank', 'noopener,noreferrer');
  }

  @HostListener('document:paste', ['$event'])
  protected async paste(event: ClipboardEvent): Promise<void> {
    const image = Array.from(event.clipboardData?.items ?? [])
      .find((item) => item.type.startsWith('image/'))?.getAsFile();
    if (image) {
      event.preventDefault();
      await this.process(image);
    }
  }

  protected async process(source: Blob): Promise<void> {
    this.error.set(null);
    try {
      const result = await this.processor.process(source);
      this.preview.set(URL.createObjectURL(result.blob));
      this.selected.emit(result.blob);
    } catch (error) {
      this.preview.set(null);
      this.error.set(error instanceof Error ? error.message : 'ไม่สามารถประมวลผลรูปภาพได้');
    }
  }
}
