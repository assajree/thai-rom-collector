import { Component, inject } from '@angular/core';
import { FirestoreDataTransferService, FirestoreBackup, ImportResult, FIRESTORE_BACKUP_COLLECTIONS } from '../services/firestore-data-transfer.service';
import { StatusMessageService } from '../shared/status-message.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({ selector: 'app-admin-firestore-data-page', standalone: true, templateUrl: './admin-firestore-data-page.component.html', styleUrl: './admin-firestore-data-page.component.css' })
export class AdminFirestoreDataPageComponent {
  private readonly transfer = inject(FirestoreDataTransferService);
  private readonly status = inject(StatusMessageService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected busy = false;
  protected selectedFile = '';
  protected preview: FirestoreBackup | null = null;
  protected result: ImportResult | null = null;
  protected readonly collectionNames = FIRESTORE_BACKUP_COLLECTIONS;

  protected async exportData(): Promise<void> {
    this.busy = true; try { const backup = await this.transfer.exportBackup(); const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `rom-collector-firestore-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url); this.status.show('Export ข้อมูลสำเร็จ'); } catch (error) { this.status.show(this.message(error, 'ไม่สามารถ Export ข้อมูลได้'), 'error'); } finally { this.busy = false; }
  }
  protected chooseFile(event: Event): void { const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return; this.selectedFile = file.name; this.result = null; file.text().then((text) => { try { this.preview = this.transfer.parseBackup(text); this.status.show('ตรวจสอบไฟล์สำเร็จ กด Import เพื่อเขียนข้อมูล'); } catch (error) { this.preview = null; this.status.show(this.message(error, 'ไฟล์ไม่ผ่านการตรวจสอบ'), 'error'); } }); }
  protected async importData(): Promise<void> { if (!this.preview || this.busy || !window.confirm('ยืนยันการ Import แบบ Merge/Upsert หรือไม่? ข้อมูลเดิมที่ไม่มีในไฟล์จะไม่ถูกลบ')) return; this.busy = true; try { this.result = await this.transfer.importBackup(this.preview); this.status.show(this.result.failed.length ? `Import สำเร็จ ${this.result.written} รายการ แต่ล้มเหลว ${this.result.failed.length} รายการ` : `Import สำเร็จ ${this.result.written} รายการ`, this.result.failed.length ? 'error' : 'success'); } catch (error) { this.status.show(this.message(error, 'ไม่สามารถ Import ข้อมูลได้'), 'error'); } finally { this.busy = false; } }
  protected async signOut(): Promise<void> { await this.auth.signOut(); await this.router.navigateByUrl('/', { replaceUrl: true }); }
  private message(error: unknown, fallback: string): string { return error instanceof Error ? error.message : fallback; }
}
