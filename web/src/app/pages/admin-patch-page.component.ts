import { Component, DestroyRef, HostListener, ViewChild, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatorRepository } from '../repositories/translator.repository';
import { TagRepository } from '../repositories/tag.repository';
import { SystemMaster, SystemRepository } from '../repositories/system.repository';
import { CoverInputComponent } from '../components/cover-input.component';
import { PatchRepository } from '../repositories/patch.repository';
import { CoverStorageService } from '../services/cover-storage.service';
import { StatusMessageService } from '../shared/status-message.service';
import { Tag, Translator } from '../models/patch.models';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfirmDialogComponent } from '../components/confirm-dialog.component';

const compareDropdownLabels = (a: { shortName: string; name: string }, b: { shortName: string; name: string }): number =>
  a.shortName.localeCompare(b.shortName, 'th', { sensitivity: 'base' }) || a.name.localeCompare(b.name, 'th', { sensitivity: 'base' });

@Component({
  selector: 'app-admin-patch-page', styleUrl: './admin-patch-page.component.css',
  standalone: true,
  imports: [ReactiveFormsModule, AsyncPipe, CoverInputComponent, ConfirmDialogComponent],
  templateUrl: './admin-patch-page.component.html'
})
export class AdminPatchPageComponent {
  @ViewChild(CoverInputComponent) private coverInput?: CoverInputComponent;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly translatorRepository = inject(TranslatorRepository);
  private readonly patchRepository = inject(PatchRepository);
  private readonly coverStorage = inject(CoverStorageService);
  private readonly status = inject(StatusMessageService);
  private readonly tagRepository = inject(TagRepository);
  private readonly systemRepository = inject(SystemRepository);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly translators = this.translatorRepository.watchAll();
  protected readonly tags = this.tagRepository.watchAll();
  protected readonly systems = this.systemRepository.watchAll();
  protected systemOptions: SystemMaster[] = [];
  protected readonly form = this.fb.nonNullable.group({ updateDate: [this.todayInputDate(), Validators.required], fileName: ['', Validators.required], gameTitle: ['', Validators.required], system: ['', Validators.required], translatorId: ['', Validators.required], patchTool: [''], patchFileUrl: [''], haveRom: [false], patchedRomUrl: [''], referenceText: [''], referenceUrl: [''] });
  protected cover?: Blob;
  protected saving = false;
  protected pastingGameTitle = false;
  protected deleteConfirmOpen = false;
  protected editId: string | null = null;
  protected newTranslatorName = '';
  protected newTranslatorShortName = '';
  protected newTranslatorLink = '';
  protected newTranslatorModTool = '';
  protected translatorDialogOpen = false;
  protected selectedTags: string[] = [];
  protected newTagName = '';
  protected tagSuggestions: Tag[] = [];
  protected tagAutocompleteOpen = false;
  protected newSystemName = '';
  protected newSystemShortName = '';
  protected systemDialogOpen = false;
  protected savingTranslator = false;
  protected savingSystem = false;
  constructor() {
    this.initializeFilenameGeneration();
    void this.loadEditRecord();
  }

  protected translatorOptions: Translator[] = [];

  private initializeFilenameGeneration(): void {
    this.translators.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (translators) => {
        this.translatorOptions = [...translators].sort(compareDropdownLabels);
        this.updateGeneratedFilename();
      }
    });
    this.systems.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((systems) => {
      this.systemOptions = [...systems].sort(compareDropdownLabels);
    });
    this.form.controls.gameTitle.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.updateGeneratedFilename());
    this.form.controls.translatorId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((translatorId) => {
      this.updateGeneratedFilename();
      if (!this.editId) this.form.controls.patchTool.setValue(this.translatorOptions.find((item) => item.id === translatorId)?.modTool ?? '');
    });
    this.tags.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((tags) => { this.tagSuggestions = tags; });
  }

  private updateGeneratedFilename(): void {
    const gameTitle = this.form.controls.gameTitle.value.trim().replace(/:/g, ' -').replace(/\s+/g, ' ');
    const translator = this.translatorOptions.find((item) => item.id === this.form.controls.translatorId.value);
    const fileName = gameTitle && translator?.shortName
      ? `${gameTitle} (Thai by ${translator.shortName.trim().replace(/\s+/g, ' ')})`
      : '';
    this.form.controls.fileName.setValue(fileName, { emitEvent: false });
  }

  protected async save(): Promise<void> {
    if (this.saving) return;
    if (this.form.invalid) { this.form.markAllAsTouched(); this.status.show('กรุณากรอกข้อมูลที่จำเป็นให้ครบ', 'error'); return; }
    this.saving = true;
    this.status.show('กำลังบันทึกแพตช์…');
    try {
      const value = this.form.getRawValue();
      const draft = { ...value, gameTitle: value.gameTitle.trim(), updateDate: this.toIsoDate(value.updateDate), tags: this.selectedTags };
      let coverUrl = '';
      const patchId = this.editId ?? crypto.randomUUID();
      const existingCoverUrl = this.editId ? (await this.patchRepository.getById(this.editId))?.coverUrl ?? '' : '';
      if (this.cover) coverUrl = await this.coverStorage.upload(patchId, this.cover, `cover_max250px_${Date.now()}.png`);
      if (this.editId) {
        await this.patchRepository.update(this.editId, draft, this.cover ? coverUrl : undefined);
        if (this.cover && existingCoverUrl && existingCoverUrl !== coverUrl) await this.coverStorage.remove(existingCoverUrl);
      }
      else await this.patchRepository.create(draft, coverUrl, patchId);
      this.status.show('บันทึกแพตช์สำเร็จ', 'success');
      const translatorModTool = this.translatorOptions.find((item) => item.id === value.translatorId)?.modTool ?? '';
      this.form.reset({
        updateDate: this.todayInputDate(),
        fileName: '',
        gameTitle: '',
        system: value.system,
        translatorId: value.translatorId,
        patchTool: translatorModTool,
        patchFileUrl: '',
        haveRom: false,
        patchedRomUrl: '',
        referenceText: '',
        referenceUrl: ''
      });
      this.selectedTags = []; this.cover = undefined; this.coverInput?.clear();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      this.status.show(error instanceof Error ? error.message : 'ไม่สามารถบันทึกแพตช์ได้', 'error');
    } finally {
      this.saving = false;
    }
  }

  protected async pasteGameTitle(): Promise<void> {
    if (this.pastingGameTitle) return;
    this.pastingGameTitle = true;
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (text) this.form.controls.gameTitle.setValue(text);
    } catch {
      // Clipboard access can be denied by the browser; leave the current value unchanged.
    } finally {
      this.pastingGameTitle = false;
    }
  }

  protected async deletePatch(): Promise<void> {
    if (!this.editId || this.saving) return;
    this.deleteConfirmOpen = true;
  }

  protected cancelDelete(): void { this.deleteConfirmOpen = false; }

  protected async confirmDelete(): Promise<void> {
    if (!this.editId || this.saving) return;
    this.deleteConfirmOpen = false;
    this.saving = true;
    this.status.show('กำลังลบแพตช์…');
    try {
      await this.patchRepository.delete(this.editId);
      this.status.show('ลบแพตช์สำเร็จ', 'success');
      await this.router.navigateByUrl('/', { replaceUrl: true });
    } catch (error) {
      this.status.show(error instanceof Error ? error.message : 'ไม่สามารถลบแพตช์ได้', 'error');
    } finally {
      this.saving = false;
    }
  }

  private async loadEditRecord(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    const patch = await this.patchRepository.getById(id);
    if (!patch) { this.status.show('ไม่พบแพตช์ที่ต้องการแก้ไข', 'error'); return; }
    this.editId = id;
    this.form.patchValue({ updateDate: this.toInputDate(patch.updateDate), fileName: patch.fileName, gameTitle: patch.gameTitle, system: patch.system, translatorId: patch.translatorId, patchTool: patch.patchTool, patchFileUrl: patch.patchFileUrl, haveRom: patch.haveRom ?? false, patchedRomUrl: patch.patchedRomUrl ?? '', referenceText: patch.referenceText ?? '', referenceUrl: patch.referenceUrl ?? '' });
    this.selectedTags = [...patch.tags];
  }
  private todayInputDate(): string {
    const now = new Date();
    const pad = (value: number): string => String(value).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }
  private toInputDate(value: string): string {
    const timestamp = Date.parse(value);
    if (Number.isNaN(timestamp)) return this.todayInputDate();
    const date = new Date(timestamp);
    const pad = (part: number): string => String(part).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
  private toIsoDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new Error('กรุณาระบุวันที่อัปเดตให้ถูกต้อง');
    return date.toISOString();
  }
  protected setUpdateDateNow(): void { this.form.controls.updateDate.setValue(this.todayInputDate()); }
  protected toggleTag(name: string): void { this.selectedTags = this.selectedTags.includes(name) ? this.selectedTags.filter((tag) => tag !== name) : [...this.selectedTags, name]; }
  protected filteredTagSuggestions(): Tag[] {
    const query = this.newTagName.trim().toLocaleLowerCase();
    return this.tagSuggestions
      .filter((tag) => !this.selectedTags.includes(tag.name))
      .filter((tag) => !query || tag.name.toLocaleLowerCase().includes(query))
      .slice(0, 8);
  }
  protected selectTag(tag: Tag): void {
    if (!this.selectedTags.includes(tag.name)) this.selectedTags = [...this.selectedTags, tag.name];
    this.newTagName = '';
    this.tagAutocompleteOpen = false;
  }
  protected removeTag(name: string): void { this.selectedTags = this.selectedTags.filter((tag) => tag !== name); }
  protected onTagInput(value: string): void { this.newTagName = value; this.tagAutocompleteOpen = true; }
  protected openTagAutocomplete(): void { this.tagAutocompleteOpen = true; }
  @HostListener('document:click')
  protected closeTagAutocomplete(): void { this.tagAutocompleteOpen = false; }
  protected async createTag(): Promise<void> {
    const name = this.newTagName.trim();
    if (!name) return;
    const existing = this.tagSuggestions.find((tag) => tag.name.toLocaleLowerCase() === name.toLocaleLowerCase());
    if (existing) { this.selectTag(existing); return; }
    try {
      const tag = await this.tagRepository.create(name);
      this.selectTag(tag);
    } catch (error) {
      this.status.show(error instanceof Error ? error.message : 'ไม่สามารถเพิ่ม tag ได้', 'error');
    }
  }
  protected async createTranslator(): Promise<void> {
    if (this.savingTranslator) return;
    try {
      const name = this.newTranslatorName.trim();
      if (!name || !this.newTranslatorShortName.trim()) { this.status.show('กรุณาระบุชื่อย่อและชื่อเต็มของทีมแปล', 'error'); return; }
      this.savingTranslator = true;
      this.status.show('กำลังบันทึกทีมแปล…');
      const translator = await this.translatorRepository.create(this.newTranslatorShortName, name, this.newTranslatorLink, this.newTranslatorModTool);
      this.translatorOptions = [...this.translatorOptions.filter((item) => item.id !== translator.id), translator].sort(compareDropdownLabels);
      this.form.controls.translatorId.setValue(translator.id);
      this.newTranslatorName = '';
      this.newTranslatorShortName = '';
      this.newTranslatorLink = '';
      this.newTranslatorModTool = '';
      this.translatorDialogOpen = false;
      this.status.show('เพิ่มทีมแปลสำเร็จ', 'success');
    } catch (error) {
      this.status.show(error instanceof Error ? error.message : 'ไม่สามารถเพิ่มทีมแปลได้', 'error');
    } finally {
      this.savingTranslator = false;
    }
  }
  protected openTranslatorDialog(): void { this.translatorDialogOpen = true; }
  protected closeTranslatorDialog(): void { this.translatorDialogOpen = false; }
  protected async createSystem(): Promise<void> {
    if (this.savingSystem) return;
    try {
      this.savingSystem = true;
      this.status.show('กำลังบันทึกเครื่องเกม…');
      const system = await this.systemRepository.create(this.newSystemShortName, this.newSystemName);
      this.form.controls.system.setValue(system.shortName);
      this.newSystemName = '';
      this.newSystemShortName = '';
      this.systemDialogOpen = false;
      this.status.show('เพิ่มเครื่องเกมสำเร็จ', 'success');
    } catch (error) {
      this.status.show(error instanceof Error ? error.message : 'ไม่สามารถเพิ่มเครื่องเกมได้', 'error');
    } finally {
      this.savingSystem = false;
    }
  }

  protected openSystemDialog(): void { this.systemDialogOpen = true; }
  protected closeSystemDialog(): void { this.systemDialogOpen = false; }

}
