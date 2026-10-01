import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RedeemRepository } from '../repositories/redeem.repository';
import { RedeemCode } from '../models/redeem.models';
import { StatusMessageService } from '../shared/status-message.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-admin-manage-redeem-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-manage-redeem-page.component.html',
  styleUrl: './admin-manage-redeem-page.component.css'
})
export class AdminManageRedeemPageComponent {
  private readonly redeemRepo = inject(RedeemRepository);
  private readonly statusMessage = inject(StatusMessageService);
  private readonly authService = inject(AuthService);

  protected readonly activeTab = signal<'add' | 'list'>('add');
  protected readonly listLoading = signal(false);
  protected readonly codesLoaded = signal(false);

  protected readonly codes = signal<RedeemCode[]>([]);
  protected readonly loading = signal(false);
  
  protected readonly newDonatedAt = signal(this.getLocalDateString());
  protected readonly newCode = signal(this.getDatePrefix(this.getLocalDateString()));
  protected readonly newAmount = signal(0);

  protected readonly editingCode = signal<RedeemCode | null>(null);
  protected readonly editCode = signal<string>('');
  protected readonly editAmount = signal<number>(0);
  protected readonly editDonatedAt = signal<string>('');

  protected switchTab(tab: 'add' | 'list'): void {
    this.activeTab.set(tab);
    if (tab === 'list') {
      void this.loadCodes();
    }
  }

  private getLocalDateString(): string {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }

  private getDatePrefix(dateStr: string): string {
    return dateStr ? dateStr.replace(/-/g, '') : '';
  }

  protected onDonatedAtChange(dateStr: string): void {
    const currentCode = this.newCode().trim();
    const oldPrefix = this.getDatePrefix(this.newDonatedAt());
    this.newDonatedAt.set(dateStr);

    if (dateStr) {
      const newPrefix = this.getDatePrefix(dateStr);
      if (!currentCode || currentCode === oldPrefix || /^\d{8}$/.test(currentCode)) {
        this.newCode.set(newPrefix);
      }
    }
  }

  protected async loadCodes(): Promise<void> {
    this.listLoading.set(true);
    try {
      const items = await this.redeemRepo.getRecentCodes(100);
      this.codes.set(items);
      this.codesLoaded.set(true);
    } catch (error: any) {
      this.statusMessage.show(error.message || 'ดึงข้อมูลไม่สำเร็จ', 'error');
    } finally {
      this.listLoading.set(false);
    }
  }

  protected async syncDonations(): Promise<void> {
    if (!confirm('ต้องการซิงค์ข้อมูลการบริจาคเก่าไปยังระบบใหม่หรือไม่? (โค้ดเก่าที่มีจำนวนเงิน > 0 จะถูกเพิ่มในหน้ารายการบริจาค)')) return;
    this.loading.set(true);
    this.statusMessage.show('กำลังซิงค์ข้อมูล...', 'info');
    try {
      const result = await this.redeemRepo.syncDonations();
      this.statusMessage.show(`ซิงค์ข้อมูลเรียบร้อย จำนวน ${result.synced} รายการ`, 'success');
      await this.loadCodes();
    } catch (error: any) {
      this.statusMessage.show(error.message || 'เกิดข้อผิดพลาดในการซิงค์ข้อมูล', 'error');
    } finally {
      this.loading.set(false);
    }
  }

  protected async addCode(): Promise<void> {
    const code = this.newCode().trim();
    const amount = this.newAmount();
    const donatedAtStr = this.newDonatedAt();
    
    let donatedAtIso: string | undefined;
    if (donatedAtStr) {
      donatedAtIso = new Date(donatedAtStr + 'T00:00:00').toISOString();
    }
    
    const adminProfile = this.authService.getAdminProfile();

    if (!code || amount < 0 || !adminProfile) return;

    this.loading.set(true);
    this.statusMessage.show('กำลังเพิ่มโค้ด...', 'info');

    try {
      await this.redeemRepo.addCode(code, amount, adminProfile.uid, donatedAtIso);
      this.statusMessage.show(`เพิ่มโค้ด ${code} สำเร็จ`, 'success');
      const today = this.getLocalDateString();
      this.newDonatedAt.set(today);
      this.newCode.set(this.getDatePrefix(today));
    } catch (error: any) {
      this.statusMessage.show(error.message || 'เกิดข้อผิดพลาด', 'error');
    } finally {
      this.loading.set(false);
    }
  }

  protected startEdit(code: RedeemCode): void {
    this.editingCode.set(code);
    this.editCode.set(code.id);
    this.editAmount.set(code.amount);
    
    if (code.donatedAt) {
      const d = new Date(code.donatedAt);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      this.editDonatedAt.set(d.toISOString().slice(0, 10));
    } else {
      this.editDonatedAt.set('');
    }
  }

  protected cancelEdit(): void {
    this.editingCode.set(null);
  }

  protected async saveEdit(code: RedeemCode): Promise<void> {
    const newCodeStr = this.editCode().trim();
    const amount = this.editAmount();
    const donatedAtStr = this.editDonatedAt();
    let donatedAtIso: string | undefined;
    if (donatedAtStr) {
      donatedAtIso = new Date(donatedAtStr + 'T00:00:00').toISOString();
    }

    if (!newCodeStr || amount < 0) return;
    
    this.loading.set(true);
    this.statusMessage.show('กำลังบันทึก...', 'info');
    try {
      await this.redeemRepo.updateCode(code.id, newCodeStr, amount, donatedAtIso);
      this.statusMessage.show('บันทึกเรียบร้อย', 'success');
      this.editingCode.set(null);
      await this.loadCodes();
    } catch (error: any) {
      this.statusMessage.show(error.message || 'เกิดข้อผิดพลาด', 'error');
    } finally {
      this.loading.set(false);
    }
  }

  protected async revokeCode(code: string): Promise<void> {
    if (!confirm(`แน่ใจหรือไม่ว่าต้องการยกเลิกการใช้งานของโค้ด ${code}?`)) return;

    this.loading.set(true);
    this.statusMessage.show(`กำลังยกเลิกโค้ด ${code}...`, 'info');

    try {
      await this.redeemRepo.revokeCode(code);
      await this.authService.refreshVipStatus();
      this.statusMessage.show(`ยกเลิกการใช้งานโค้ด ${code} สำเร็จ`, 'success');
      await this.loadCodes();
    } catch (error: any) {
      this.statusMessage.show(error.message || 'เกิดข้อผิดพลาดในการยกเลิกโค้ด', 'error');
    } finally {
      this.loading.set(false);
    }
  }

  protected async deleteCode(code: RedeemCode): Promise<void> {
    const confirmMsg = code.isRedeemed
      ? `แน่ใจหรือไม่ว่าต้องการลบโค้ด ${code.id}?\nโค้ดนี้ถูกใช้งานแล้ว การลบจะยกเลิกสิทธิ์ VIP ของผู้ใช้นี้ด้วย`
      : `แน่ใจหรือไม่ว่าต้องการลบโค้ด ${code.id}?`;
    if (!confirm(confirmMsg)) return;

    this.loading.set(true);
    this.statusMessage.show(`กำลังลบโค้ด ${code.id}...`, 'info');

    try {
      await this.redeemRepo.deleteCode(code.id);
      await this.authService.refreshVipStatus();
      this.statusMessage.show(`ลบโค้ด ${code.id} สำเร็จ`, 'success');
      await this.loadCodes();
    } catch (error: any) {
      this.statusMessage.show(error.message || 'เกิดข้อผิดพลาดในการลบโค้ด', 'error');
    } finally {
      this.loading.set(false);
    }
  }
}
