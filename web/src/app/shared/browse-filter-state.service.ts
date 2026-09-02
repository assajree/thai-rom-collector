import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BrowseFilterStateService {
  readonly selectedTag = signal<string | null>(null);
  readonly selectedSystem = signal<string | null>(null);
  readonly selectedTranslatorId = signal<string | null>(null);
}
