import { Component, DestroyRef, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatorRepository } from '../repositories/translator.repository';
import { TagRepository } from '../repositories/tag.repository';
import { SystemRepository } from '../repositories/system.repository';
import { CoverInputComponent } from '../components/cover-input.component';
import { PatchRepository } from '../repositories/patch.repository';
import { CoverStorageService } from '../services/cover-storage.service';
import { StatusMessageService } from '../shared/status-message.service';
import { Translator } from '../models/patch.models';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-admin-patch-page', styleUrl: './admin-patch-page.component.css',
  standalone: true,
  imports: [ReactiveFormsModule, AsyncPipe, CoverInputComponent],
  templateUrl: './admin-patch-page.component.html'
})
export class AdminPatchPageComponent {
  private readonly route = inject(ActivatedRoute);
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
  protected readonly form = this.fb.nonNullable.group({ updateDate: [this.todayInputDate(), Validators.required], fileName: ['', Validators.required], gameTitle: ['', Validators.required], system: ['', Validators.required], translatorId: ['', Validators.required], patchTool: [''], patchFileUrl: [''] });
  protected cover?: Blob;
  protected editId: string | null = null;
  protected newTranslatorName = '';
  protected newTranslatorShortName = '';
  protected newTranslatorLink = '';
  protected translatorDialogOpen = false;
  protected selectedTags: string[] = [];
  protected newTagName = '';
  protected newSystemName = '';
  protected newSystemShortName = '';
  protected systemDialogOpen = false;
  constructor() {
    this.initializeFilenameGeneration();
    void this.loadEditRecord();
  }

  private translatorOptions: Translator[] = [];

  private initializeFilenameGeneration(): void {
    this.translators.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (translators) => {
        this.translatorOptions = translators;
        this.updateGeneratedFilename();
      }
    });
    this.form.controls.gameTitle.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.updateGeneratedFilename());
    this.form.controls.translatorId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.updateGeneratedFilename());
  }

  private updateGeneratedFilename(): void {
    const gameTitle = this.form.controls.gameTitle.value.trim().replace(/\s+/g, ' ');
    const translator = this.translatorOptions.find((item) => item.id === this.form.controls.translatorId.value);
    const fileName = gameTitle && translator?.shortName
      ? `${gameTitle} (Thai by ${translator.shortName.trim().replace(/\s+/g, ' ')})`
      : '';
    this.form.controls.fileName.setValue(fileName, { emitEvent: false });
  }

  protected async save(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); this.status.show('กรุณากรอกข้อมูลที่จำเป็นให้ครบ', 'error'); return; }
    try {
      const value = this.form.getRawValue();
      const draft = { ...value, updateDate: this.toIsoDate(value.updateDate), tags: this.selectedTags };
      let coverUrl = '';
      const patchId = this.editId ?? crypto.randomUUID();
      if (this.cover) coverUrl = await this.coverStorage.upload(patchId, this.cover, `cover_max250px_${Date.now()}.jpg`);
      if (this.editId) await this.patchRepository.update(this.editId, draft, this.cover ? coverUrl : undefined);
      else await this.patchRepository.create(draft, coverUrl, patchId);
      this.status.show('บันทึกแพตช์สำเร็จ');
      this.form.reset(); this.selectedTags = []; this.cover = undefined;
    } catch (error) {
      this.status.show(error instanceof Error ? error.message : 'ไม่สามารถบันทึกแพตช์ได้', 'error');
    }
  }

  private async loadEditRecord(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    const patch = await this.patchRepository.getById(id);
    if (!patch) { this.status.show('ไม่พบแพตช์ที่ต้องการแก้ไข', 'error'); return; }
    this.editId = id;
    this.form.patchValue({ updateDate: this.toInputDate(patch.updateDate), fileName: patch.fileName, gameTitle: patch.gameTitle, system: patch.system, translatorId: patch.translatorId, patchTool: patch.patchTool, patchFileUrl: patch.patchFileUrl });
    this.selectedTags = [...patch.tags];
  }
  private todayInputDate(): string { return new Date().toISOString().slice(0, 10); }
  private toInputDate(value: string): string { const timestamp = Date.parse(value); return Number.isNaN(timestamp) ? this.todayInputDate() : new Date(timestamp).toISOString().slice(0, 10); }
  private toIsoDate(value: string): string { const timestamp = Date.parse(`${value}T00:00:00.000Z`); if (Number.isNaN(timestamp)) throw new Error('กรุณาระบุวันที่อัปเดตให้ถูกต้อง'); return new Date(timestamp).toISOString(); }
  protected toggleTag(name: string): void { this.selectedTags = this.selectedTags.includes(name) ? this.selectedTags.filter((tag) => tag !== name) : [...this.selectedTags, name]; }
  protected async createTag(): Promise<void> { const name = this.newTagName.trim(); if (!name) return; const tag = await this.tagRepository.create(name); if (!this.selectedTags.includes(tag.name)) this.selectedTags = [...this.selectedTags, tag.name]; this.newTagName = ''; }
  protected async createTranslator(): Promise<void> {
    try {
      const name = this.newTranslatorName.trim();
      if (!name || !this.newTranslatorShortName.trim()) { this.status.show('กรุณาระบุชื่อย่อและชื่อเต็มของทีมแปล', 'error'); return; }
      const translator = await this.translatorRepository.create(this.newTranslatorShortName, name, this.newTranslatorLink);
      this.form.controls.translatorId.setValue(translator.id);
      this.newTranslatorName = '';
      this.newTranslatorShortName = '';
      this.newTranslatorLink = '';
      this.translatorDialogOpen = false;
    } catch (error) {
      this.status.show(error instanceof Error ? error.message : 'ไม่สามารถเพิ่มทีมแปลได้', 'error');
    }
  }
  protected openTranslatorDialog(): void { this.translatorDialogOpen = true; }
  protected closeTranslatorDialog(): void { this.translatorDialogOpen = false; }
  protected async createSystem(): Promise<void> {
    try {
      const system = await this.systemRepository.create(this.newSystemShortName, this.newSystemName);
      this.form.controls.system.setValue(system.name);
      this.newSystemName = '';
      this.newSystemShortName = '';
      this.systemDialogOpen = false;
    } catch (error) {
      this.status.show(error instanceof Error ? error.message : 'ไม่สามารถเพิ่มเครื่องเกมได้', 'error');
    }
  }

  protected openSystemDialog(): void { this.systemDialogOpen = true; }
  protected closeSystemDialog(): void { this.systemDialogOpen = false; }

}
