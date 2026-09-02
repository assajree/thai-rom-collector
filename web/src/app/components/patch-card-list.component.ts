import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Patch } from '../models/patch.models';

@Component({
  selector: 'app-patch-card-list',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './patch-card-list.component.html',
  styleUrl: './patch-card-list.component.css'
})
export class PatchCardListComponent {
  @Input() patches: Patch[] = [];
  @Input() canEdit = false;
  protected hasTags(tags: string[]): boolean {
    return tags.some((tag) => tag.trim().length > 0);
  }
  protected onImageError(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.onerror = null;
    image.src = 'assets/images/no-image.jpg';
  }
}
