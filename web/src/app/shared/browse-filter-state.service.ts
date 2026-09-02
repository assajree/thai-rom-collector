import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BrowseFilterStateService {
  readonly selectedTag = signal<string | null>(null);
  readonly selectedSystem = signal<string | null>(null);
  readonly selectedTranslatorId = signal<string | null>(null);
  readonly clearAllRequested = signal(0);

  clearAll(): void {
    this.selectedTag.set(null);
    this.selectedSystem.set(null);
    this.selectedTranslatorId.set(null);
    this.clearAllRequested.update((value) => value + 1);
  }
}
