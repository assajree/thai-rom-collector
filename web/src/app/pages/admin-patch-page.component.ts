import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatorRepository } from '../repositories/translator.repository';
import { TagRepository } from '../repositories/tag.repository';
import { CoverInputComponent } from '../components/cover-input.component';
import { PatchRepository } from '../repositories/patch.repository';
import { CoverStorageService } from '../services/cover-storage.service';
import { StatusMessageService } from '../shared/status-message.service';

@Component({
  selector: 'app-admin-patch-page', styleUrl: './admin-patch-page.component.css',
  standalone: true,
  imports: [ReactiveFormsModule, AsyncPipe, CoverInputComponent],
  templateUrl: './admin-patch-page.component.html'
})
export class AdminPatchPageComponent {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly translatorRepository = inject(TranslatorRepository);
  private readonly patchRepository = inject(PatchRepository);
  private readonly coverStorage = inject(CoverStorageService);
  private readonly status = inject(StatusMessageService);
  private readonly tagRepository = inject(TagRepository);
  protected readonly translators = this.translatorRepository.watchAll();
  protected readonly tags = this.tagRepository.watchAll();
  protected readonly form = this.fb.nonNullable.group({ fileName: ['', Validators.required], gameTitle: ['', Validators.required], system: ['', Validators.required], translatorId: ['', Validators.required], patchTool: [''], patchFileUrl: [''] });
  protected cover?: Blob;
  protected editId: string | null = null;
  protected newTranslatorName = '';
  protected newTranslatorLink = '';
  protected selectedTags: string[] = [];
  protected newTagName = '';
  constructor() { void this.loadEditRecord(); }

  protected async save(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); this.status.show('กรุณากรอกข้อมูลที่จำเป็นให้ครบ', 'error'); return; }
    try {
      const value = this.form.getRawValue();
      const draft = { ...value, tags: this.selectedTags };
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
    this.form.patchValue({ fileName: patch.fileName, gameTitle: patch.gameTitle, system: patch.system, translatorId: patch.translatorId, patchTool: patch.patchTool, patchFileUrl: patch.patchFileUrl });
    this.selectedTags = [...patch.tags];
  }
  protected toggleTag(name: string): void { this.selectedTags = this.selectedTags.includes(name) ? this.selectedTags.filter((tag) => tag !== name) : [...this.selectedTags, name]; }
  protected async createTag(): Promise<void> { const name = this.newTagName.trim(); if (!name) return; const tag = await this.tagRepository.create(name); if (!this.selectedTags.includes(tag.name)) this.selectedTags = [...this.selectedTags, tag.name]; this.newTagName = ''; }
  protected async createTranslator(): Promise<void> {
    const name = this.newTranslatorName.trim();
    if (!name) return;
    const translator = await this.translatorRepository.create(name, this.newTranslatorLink);
    this.form.controls.translatorId.setValue(translator.id);
    this.newTranslatorName = '';
    this.newTranslatorLink = '';
  }

  protected async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl('/', { replaceUrl: true });
  }
}
