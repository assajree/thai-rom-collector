import { Component, EventEmitter, HostListener, Output, inject, signal } from '@angular/core';
import { ImageProcessorService } from '../services/image-processor.service';

@Component({
  selector: 'app-cover-input',
  standalone: true,
  templateUrl: './cover-input.component.html',
  styleUrl: './cover-input.component.css'
})
export class CoverInputComponent {
  @Output() selected = new EventEmitter<Blob>();
  private readonly processor = inject(ImageProcessorService);
  protected readonly preview = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  protected async select(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) await this.process(file);
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
