import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Patch, Tag } from '../models/patch.models';

@Component({
  selector: 'app-patch-table',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './patch-table.component.html',
  styleUrl: './patch-table.component.css'
})
export class PatchTableComponent {
  @Input() patches: Patch[] = [];
  @Input() tags: Tag[] = [];
  @Input() canEdit = false;
  protected tagNames(patch: Patch): string {
    return patch.tags.map((id) => this.tags.find((tag) => tag.id === id)?.name ?? '').filter(Boolean).join(', ');
  }
}
