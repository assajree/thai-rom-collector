import { Component, Input } from '@angular/core';
import { Patch } from '../models/patch.models';

@Component({
  selector: 'app-patch-card-list',
  standalone: true,
  templateUrl: './patch-card-list.component.html',
  styleUrl: './patch-card-list.component.css'
})
export class PatchCardListComponent {
  @Input() patches: Patch[] = [];
  protected onImageError(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.onerror = null;
    image.src = 'assets/images/no-image.jpg';
  }
}
