import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Patch } from '../models/patch.models';

@Component({
  selector: 'app-patch-table',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './patch-table.component.html',
  styleUrl: './patch-table.component.css'
})
export class PatchTableComponent {
  @Input() patches: Patch[] = [];
  @Input() canEdit = false;
}
