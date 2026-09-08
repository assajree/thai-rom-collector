import { Component, effect, inject, OnDestroy, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NavigationStart, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';

import { StatusMessageService } from './shared/status-message.service';
import { AuthService } from './services/auth.service';
import { Tag, Translator } from './models/patch.models';
import { SystemMaster, SystemRepository } from './repositories/system.repository';
import { TagRepository } from './repositories/tag.repository';
import { TranslatorRepository } from './repositories/translator.repository';
import { ServerCostRepository } from './repositories/server-cost.repository';
import { BrowseFilterStateService } from './shared/browse-filter-state.service';
import { browseRoute } from './shared/browse-route.util';
import { PatchCacheService } from './services/patch-cache.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  protected readonly statusMessageService = inject(StatusMessageService);
  protected readonly authService = inject(AuthService);
  private readonly tagRepository = inject(TagRepository);
  private readonly translatorRepository = inject(TranslatorRepository);
  private readonly systemRepository = inject(SystemRepository);
  private readonly serverCostRepository = inject(ServerCostRepository);
  private readonly patchCache = inject(PatchCacheService);
  private readonly router = inject(Router);
  private readonly swUpdate = inject(SwUpdate, { optional: true });
  protected readonly filterState = inject(BrowseFilterStateService);
  protected readonly statusMessage = this.statusMessageService.message;
  protected readonly platforms = signal<SystemMaster[]>([]);
  protected readonly tags = signal<Tag[]>([]);
  protected readonly translators = signal<Translator[]>([]);
  protected readonly serverCost = signal<number | null>(this.serverCostRepository.getCached());
  private readonly sidebarScrollLock = effect(() => {
    this.document.body.classList.toggle('sidebar-open', this.sidebarOpen());
  });
  protected readonly sidebarOpen = signal(false);
  protected readonly browseRoute = browseRoute;
  protected readonly isOffline = signal(false);
  protected readonly patchCacheLastUpdated = this.patchCache.lastUpdated;
  protected readonly patchCacheLastUpdatedLabel = () => {
    const timestamp = this.patchCacheLastUpdated();
    return timestamp === null ? 'ยังไม่มีข้อมูล cache' : new Intl.DateTimeFormat('th-TH', {
      dateStyle: 'medium', timeStyle: 'short'
    }).format(timestamp);
  };
  private readonly onlineHandler = () => {
    this.isOffline.set(false);
    this.loadServerCost();
  };
  private readonly offlineHandler = () => this.isOffline.set(true);

  protected toggleSidebar(): void { this.sidebarOpen.update((open) => !open); }
  protected closeSidebar(): void { this.sidebarOpen.set(false); }
  protected clearAllFilters(): void {
    this.filterState.clearAll();
    this.closeSidebar();
  }
  protected selectPlatform(platform: string | null): void {
    this.filterState.selectedSystem.set(platform);
    this.filterState.selectedTranslatorId.set(null);
    this.filterState.selectedTag.set(null);
    this.closeSidebar();
  }
  protected selectTranslator(translatorId: string | null): void {
    this.filterState.selectedTranslatorId.set(translatorId);
    this.filterState.selectedSystem.set(null);
    this.filterState.selectedTag.set(null);
    this.closeSidebar();
  }
  protected selectRouteTag(tag: string): void {
    this.filterState.selectedTag.set(tag);
    this.filterState.selectedSystem.set(null);
    this.filterState.selectedTranslatorId.set(null);
    this.closeSidebar();
  }
  protected forceRefreshPatches(): void {
    this.patchCache.requestForceRefresh();
    this.tagRepository.refreshAll();
    this.translatorRepository.refreshAll();
    this.systemRepository.refreshAll();
    this.loadServerCost();
    this.statusMessageService.show('รีเฟรชข้อมูลล่าสุดเรียบร้อยแล้ว', 'success');
    this.closeSidebar();
  }

  private loadServerCost(): void {
    this.serverCostRepository.read()
      .then((cost) => this.serverCost.set(cost))
      .catch(() => {
        const cached = this.serverCostRepository.getCached();
        if (cached !== null) this.serverCost.set(cached);
      });
  }

  constructor() {
    this.isOffline.set(typeof navigator !== 'undefined' && !navigator.onLine);
    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);
    this.watchForAppUpdates();
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) this.statusMessageService.clear();
    });
    this.tagRepository.watchAll().subscribe({ next: (tags) => this.tags.set(tags) });
    this.translatorRepository.watchAll().subscribe({ next: (translators) => this.translators.set(translators) });
    this.systemRepository.watchAll().subscribe({ next: (systems) => this.platforms.set(systems) });
    this.loadServerCost();
  }

  ngOnDestroy(): void {
    window.removeEventListener('online', this.onlineHandler);
    window.removeEventListener('offline', this.offlineHandler);
    this.document.body.classList.remove('sidebar-open');
    this.sidebarScrollLock.destroy();
  }

  private watchForAppUpdates(): void {
    if (!this.swUpdate?.isEnabled) return;
    this.swUpdate.versionUpdates.subscribe((event) => {
      if (event.type === 'VERSION_READY') {
        this.statusMessageService.show('มีเวอร์ชันใหม่พร้อมใช้งาน กำลังโหลดเวอร์ชันล่าสุด…');
        void this.swUpdate?.activateUpdate().then(() => window.location.reload());
      }
    });
  }

  protected async signIn(): Promise<void> {
    try {
      await this.authService.signInWithGoogle();
      this.statusMessageService.show('เข้าสู่ระบบแล้ว กำลังตรวจสอบสิทธิ์ผู้ดูแลระบบ');
    } catch {
      this.statusMessageService.show('ไม่สามารถเข้าสู่ระบบด้วย Google ได้ กรุณาลองใหม่อีกครั้ง', 'error');
    }
  }

  protected async signOut(): Promise<void> {
    await this.authService.signOut();
    this.statusMessageService.show('ออกจากระบบแล้ว');
  }
}
