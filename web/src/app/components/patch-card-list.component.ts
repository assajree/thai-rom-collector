import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Patch } from '../models/patch.models';

@Component({
  selector: 'app-patch-card-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './patch-card-list.component.html',
  styleUrl: './patch-card-list.component.css'
})
export class PatchCardListComponent {
  @Input() patches: Patch[] = [];
  @Input() canEdit = false;
  protected hasTags(tags: string[]): boolean {
    return tags.some((tag) => tag.trim().length > 0);
  }
  protected formatUpdateDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('th-TH', {
      day: 'numeric', month: 'short', year: 'numeric'
    }).format(date);
  }
  protected onImageError(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.onerror = null;
    image.src = 'assets/images/no-image.jpg';
  }
  protected async downloadCover(event: Event, patch: Patch): Promise<void> {
    event.preventDefault();
    const card = (event.currentTarget as HTMLElement).closest('.patch-card');
    const image = card?.querySelector<HTMLImageElement>('.patch-cover-image');
    const imageUrl = image?.currentSrc || patch.coverUrl;
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`ไม่สามารถดาวน์โหลดรูปได้ (${response.status})`);
    const blobUrl = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = patch.fileName;
    link.click();
    URL.revokeObjectURL(blobUrl);
  }
}
