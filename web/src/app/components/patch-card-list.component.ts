import { Component, Input, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Patch, Tag, Translator } from '../models/patch.models';
import { browseRoute } from '../shared/browse-route.util';
import { SystemMaster } from '../repositories/system.repository';
import { StatusMessageService } from '../shared/status-message.service';

@Component({
  selector: 'app-patch-card-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './patch-card-list.component.html',
  styleUrl: './patch-card-list.component.css'
})
export class PatchCardListComponent {
  private static readonly newGameWindowMs = 7 * 24 * 60 * 60 * 1000;
  private readonly status = inject(StatusMessageService);
  @Input() patches: Patch[] = [];
  @Input() translators: Translator[] = [];
  @Input() systems: SystemMaster[] = [];
  @Input() tags: Tag[] = [];
  @Input() canEdit = false;
  protected readonly loadedImages = signal(new Set<string>());
  protected translatorLink(patch: Patch): string | undefined {
    return this.translators.find((translator) => translator.id === patch.translatorId)?.link;
  }
  protected translatorTool(patch: Patch): string | undefined {
    return this.translators.find((translator) => translator.id === patch.translatorId)?.modTool;
  }
  protected translatorShortName(patch: Patch): string | undefined {
    return this.translators.find((translator) => translator.id === patch.translatorId)?.shortName;
  }
  protected translatorName(patch: Patch): string {
    return this.translators.find((translator) => translator.id === patch.translatorId)?.name ?? patch.translatedBy;
  }
  protected coverFilename(patch: Patch): string {
    const gameTitle = patch.gameTitle.trim().replace(/:/g, ' -').replace(/\s+/g, ' ');
    const shortName = this.translators.find((item) => item.id === patch.translatorId)?.shortName.trim().replace(/\s+/g, ' ');
    return `${shortName ? `${gameTitle} (Thai by ${shortName})` : gameTitle || 'cover'}.png`;
  }
  protected cardTags(patch: Patch): string[] {
    return patch.tags.map((id) => this.tags.find((tag) => tag.id === id)?.name ?? '').filter(Boolean);
  }
  protected browseRoute = browseRoute;
  protected systemName(shortName: string): string {
    return this.systems.find((system) => system.shortName === shortName)?.name ?? shortName;
  }
  protected hasTags(tags: string[]): boolean {
    return tags.some((tag) => tag.trim().length > 0);
  }
  protected hasDownloadLinks(patch: Patch): boolean {
    return Boolean(patch.coverUrl || patch.patchTool || patch.patchFileUrl || patch.referenceUrl || patch.walkthroughUrl || patch.patchedRomUrl);
  }
  protected formatUpdateDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('th-TH', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(date);
  }
  protected onImageError(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.onerror = null;
    image.src = 'assets/images/no-image.jpg';
  }
  protected onImageLoad(patchId: string): void {
    this.loadedImages.update((loaded) => new Set(loaded).add(patchId));
  }
  protected imageUrl(patch: Patch): string {
    if (!patch.coverUrl) return 'assets/images/no-image.jpg';
    const version = encodeURIComponent(patch.updateDate || patch.id);
    return `${patch.coverUrl}${patch.coverUrl.includes('?') ? '&' : '?'}v=${version}`;
  }
  protected async downloadCover(event: Event, patch: Patch): Promise<void> {
    event.preventDefault();
    const card = (event.currentTarget as HTMLElement).closest('.patch-card');
    const image = card?.querySelector<HTMLImageElement>('.patch-cover-image');
    const imageUrl = image?.currentSrc || patch.coverUrl;
    this.status.show('กำลังดาวน์โหลดภาพปก…');
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`ไม่สามารถดาวน์โหลดรูปได้ (${response.status})`);
      const blobUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = this.coverFilename(patch);
      link.click();
      URL.revokeObjectURL(blobUrl);
      this.status.show('ดาวน์โหลดภาพปกสำเร็จ', 'success');
    } catch (error) {
      this.status.show(error instanceof Error ? error.message : 'ไม่สามารถดาวน์โหลดภาพปกได้', 'error');
    }
  }
  protected isNewGame(updateDate: string): boolean {
    const timestamp = Date.parse(updateDate);
    const now = Date.now();
    return !Number.isNaN(timestamp)
      && timestamp >= now - PatchCardListComponent.newGameWindowMs
      && timestamp <= now;
  }
}
