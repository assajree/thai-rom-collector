import { Component, Input } from '@angular/core';
import { Patch } from '../models/patch.models';

@Component({
  selector: 'app-patch-table',
  standalone: true,
  templateUrl: './patch-table.component.html',
  styleUrl: './patch-table.component.css'
})
export class PatchTableComponent { @Input() patches: Patch[] = []; }
