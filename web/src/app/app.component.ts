import { Component, computed, effect, inject, OnDestroy, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { StatusMessageService } from './shared/status-message.service';
import { AuthService } from './services/auth.service';
import { Tag, Translator } from './models/patch.models';
import { SystemMaster, SystemRepository } from './repositories/system.repository';
import { TagRepository } from './repositories/tag.repository';
import { TranslatorRepository } from './repositories/translator.repository';
import { BrowseFilterStateService } from './shared/browse-filter-state.service';
import { browseRoute } from './shared/browse-route.util';

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
  protected readonly filterState = inject(BrowseFilterStateService);
  protected readonly statusMessage = this.statusMessageService.message;
  protected readonly platforms = signal<SystemMaster[]>([]);
  protected readonly tags = signal<Tag[]>([]);
  protected readonly translators = signal<Translator[]>([]);
  private readonly sidebarScrollLock = effect(() => {
    this.document.body.classList.toggle('sidebar-open', this.sidebarOpen());
  });
  protected readonly sidebarOpen = signal(false);
  protected readonly browseRoute = browseRoute;

  protected toggleSidebar(): void { this.sidebarOpen.update((open) => !open); }
  protected closeSidebar(): void { this.sidebarOpen.set(false); }
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

  constructor() {
    this.tagRepository.watchAll().subscribe({ next: (tags) => this.tags.set(tags) });
    this.translatorRepository.watchAll().subscribe({ next: (translators) => this.translators.set(translators) });
    this.systemRepository.watchAll().subscribe({ next: (systems) => this.platforms.set(systems) });
  }

  ngOnDestroy(): void {
    this.document.body.classList.remove('sidebar-open');
    this.sidebarScrollLock.destroy();
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
