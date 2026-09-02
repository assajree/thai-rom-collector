import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PatchRepository } from '../repositories/patch.repository';
import { TranslatorRepository } from '../repositories/translator.repository';
import { Patch, Translator } from '../models/patch.models';
import { GameListControlsComponent } from '../components/game-list-controls.component';
import { PatchCardListComponent } from '../components/patch-card-list.component';
import { AuthService } from '../services/auth.service';
import { BrowseFilterStateService } from '../shared/browse-filter-state.service';
import { normalizeBrowseName } from '../shared/browse-route.util';

@Component({
  selector: 'app-browse-page',
  standalone: true,
  imports: [GameListControlsComponent, PatchCardListComponent],
  styleUrl: './browse-page.component.css',
  templateUrl: './browse-page.component.html'
})
export class BrowsePageComponent {
  private readonly patchRepository = inject(PatchRepository);
  private readonly filterState = inject(BrowseFilterStateService);
  private readonly translatorRepository = inject(TranslatorRepository);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);
  protected readonly patches = signal<Patch[]>([]);
  protected readonly keyword = signal('');
  protected readonly selectedTag = this.filterState.selectedTag;
  protected readonly selectedTranslatorId = this.filterState.selectedTranslatorId;
  protected readonly selectedSystem = this.filterState.selectedSystem;
  protected readonly systems = computed(() => [...new Set(this.patches().map((patch) => patch.system.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'th', { sensitivity: 'base' })));
  protected readonly translators = signal<Translator[]>([]);
  protected readonly loading = signal(true);
  protected readonly unavailable = signal(false);
  protected readonly sortBy = signal<'gameTitle' | 'translatedBy' | 'system' | 'updateDate'>('updateDate');
  protected readonly direction = signal<'asc' | 'desc'>('desc');
  protected readonly routeKind = signal<'system' | 'translator' | 'tag' | null>(null);
  private readonly routeSlug = signal<string | null>(null);
  protected readonly activeRouteLabel = computed(() => {
    const slug = this.routeSlug();
    return slug ? decodeURIComponent(slug) : null;
  });
  private readonly patchesLoaded = signal(false);
  private readonly translatorsLoaded = signal(false);
  protected readonly filters = computed(() => ({ keyword: this.keyword(), tag: this.selectedTag(), translatorId: this.selectedTranslatorId(), system: this.selectedSystem(), sortBy: this.sortBy(), sortDirection: this.direction() }));
  protected readonly sortedPatches = computed(() => this.patches().filter((patch) => {
    const tag = this.selectedTag();
    if (tag && !patch.tags.includes(tag)) return false;
    const translatorId = this.selectedTranslatorId();
    if (translatorId && patch.translatorId !== translatorId) return false;
    const system = this.selectedSystem();
    if (system && patch.system.trim() !== system) return false;
    const query = this.keyword().trim().toLocaleLowerCase('th');
    if (!query) return true;
    return [patch.gameTitle, patch.fileName, patch.system, patch.translatedBy]
      .some((value) => value.trim().toLocaleLowerCase('th').includes(query));
  }).sort((a, b) => {
    const field = this.sortBy();
    const primary = field === 'updateDate'
      ? (Number.isNaN(Date.parse(a.updateDate)) ? Number.NEGATIVE_INFINITY : Date.parse(a.updateDate))
        - (Number.isNaN(Date.parse(b.updateDate)) ? Number.NEGATIVE_INFINITY : Date.parse(b.updateDate))
      : a[field].localeCompare(b[field], 'th', { sensitivity: 'base' });
    if (primary !== 0) return primary * (this.direction() === 'asc' ? 1 : -1);
    return a.id.localeCompare(b.id);
  }));
  private readonly routeFilterEffect = effect(() => {
    const kind = this.routeKind();
    const slug = this.routeSlug();
    if (kind === null) {
      this.filterState.selectedSystem.set(null);
      this.filterState.selectedTranslatorId.set(null);
      this.filterState.selectedTag.set(null);
      return;
    }
    if (!slug) return;
    const value = decodeURIComponent(slug);
    if (kind === 'system') {
      if (!this.patchesLoaded()) return;
      const system = this.patches().find((patch) => normalizeBrowseName(patch.system) === normalizeBrowseName(value))?.system;
      if (!system) return void this.router.navigateByUrl('/');
      this.filterState.selectedSystem.set(normalizeBrowseName(system));
      this.filterState.selectedTranslatorId.set(null);
      this.filterState.selectedTag.set(null);
    } else if (kind === 'translator') {
      if (!this.translatorsLoaded()) return;
      const translator = this.translators().find((item) => normalizeBrowseName(item.name) === normalizeBrowseName(value));
      if (!translator) return void this.router.navigateByUrl('/');
      this.filterState.selectedSystem.set(null);
      this.filterState.selectedTranslatorId.set(translator.id);
      this.filterState.selectedTag.set(null);
    } else if (kind === 'tag') {
      if (!this.patchesLoaded()) return;
      const tag = [...new Set(this.patches().flatMap((patch) => patch.tags))].find((item) => normalizeBrowseName(item) === normalizeBrowseName(value));
      if (!tag) return void this.router.navigateByUrl('/');
      this.filterState.selectedSystem.set(null);
      this.filterState.selectedTranslatorId.set(null);
      this.filterState.selectedTag.set(tag);
    }
  });
  protected setSort(value: 'gameTitle' | 'translatedBy' | 'system' | 'updateDate'): void { this.sortBy.set(value); }
  protected toggleDirection(): void { this.direction.update((value) => value === 'asc' ? 'desc' : 'asc'); }
  protected setKeyword(value: string): void { this.keyword.set(value); }
  protected clearKeyword(): void { this.keyword.set(''); }
  protected toggleTag(tag: string): void { this.selectedTag.update((current) => current === tag ? null : tag); }
  protected clearTag(): void { this.selectedTag.set(null); }
  protected setTranslator(value: string): void { this.selectedTranslatorId.set(value || null); }
  protected setSystem(value: string): void { this.selectedSystem.set(value || null); }
  protected clearSystem(): void { this.selectedSystem.set(null); }
  protected clearTranslator(): void { this.selectedTranslatorId.set(null); }
  protected setFilters(value: import('../models/patch.models').GameListFilters): void { this.keyword.set(value.keyword); this.selectedTag.set(value.tag); this.selectedTranslatorId.set(value.translatorId); this.selectedSystem.set(value.system); this.sortBy.set(value.sortBy); this.direction.set(value.sortDirection); }

  constructor() {
    this.patchRepository.watchAll().subscribe({ next: (patches) => { this.patches.set(patches); this.patchesLoaded.set(true); this.loading.set(false); }, error: () => { this.unavailable.set(true); this.loading.set(false); } });
    this.translatorRepository.watchAll().subscribe({ next: (translators) => { this.translators.set(translators); this.translatorsLoaded.set(true); }, error: () => this.unavailable.set(true) });
    this.route.data.subscribe((data) => {
      this.routeKind.set((data['browseKind'] as 'system' | 'translator' | 'tag' | undefined) ?? null);
    });
    this.route.paramMap.subscribe((params) => {
      this.routeSlug.set(params.get('slug'));
    });
  }
}
