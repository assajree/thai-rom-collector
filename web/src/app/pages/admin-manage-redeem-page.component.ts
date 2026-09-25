import { Component, inject, OnInit, signal } from '@angular/core';
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
  template: `
    <div class="px-4 py-6 sm:px-6 max-w-4xl mx-auto">
      <div class="retro-window mb-6">
        <div class="retro-window-titlebar">
          <h1 class="retro-window-title">เพิ่มโค้ด Redeem ใหม่</h1>
        </div>
        <div class="retro-window-content">
          <form (ngSubmit)="addCode()" class="flex flex-col sm:flex-row gap-4 items-end flex-wrap">
            <div class="flex-1 w-full min-w-[200px]">
              <label for="newCode" class="block font-bold mb-1">รหัส Redeem (วันเวลาที่โอน YYYYMMDDHHmm)</label>
              <input id="newCode" name="newCode" type="text" [(ngModel)]="newCode" required class="app-input w-full" placeholder="เช่น 202609241105" [disabled]="loading()">
            </div>
            <div class="w-full sm:w-32">
              <label for="newAmount" class="block font-bold mb-1">จำนวนเงิน</label>
              <input id="newAmount" name="newAmount" type="number" [(ngModel)]="newAmount" required min="0" class="app-input w-full" [disabled]="loading()" (focus)="$any($event.target).select()">
            </div>
            <div class="w-full sm:w-56">
              <label for="newDonatedAt" class="block font-bold mb-1 flex justify-between items-end">
                <span>วันที่โอน (ตัวเลือก)</span>
              </label>
              <input id="newDonatedAt" name="newDonatedAt" type="date" [(ngModel)]="newDonatedAt" class="app-input w-full" [disabled]="loading()">
            </div>
            <button type="submit" class="retro-system-button font-bold h-[38px] w-full sm:w-auto whitespace-nowrap" [disabled]="!newCode() || newAmount() < 0 || loading()">
              <i class="fa-solid fa-plus mr-1"></i> เพิ่มโค้ด
            </button>
          </form>
        </div>
      </div>

      <div class="retro-window">
        <div class="retro-window-titlebar">
          <h2 class="retro-window-title">รายการโค้ดล่าสุด ({{ codes().length }} รายการ)</h2>
          <button type="button" class="no-button text-black ml-auto mr-4" (click)="syncDonations()" aria-label="Sync Donations" title="ซิงค์ข้อมูลการบริจาคย้อนหลัง">
              <i class="fa-solid fa-cloud-arrow-up"></i> Sync
            </button>
            <button type="button" class="no-button text-black" (click)="loadCodes()" aria-label="รีเฟรช">
            <i class="fa-solid fa-rotate-right"></i>
          </button>
        </div>
        <div class="retro-window-content overflow-x-auto p-0">
          <table class="w-full text-left text-sm border-collapse">
            <thead>
              <tr class="bg-slate-200 border-b-2 border-slate-400">
                <th class="p-2 border-r border-slate-300">รหัส Redeem (วันเวลาโอน)</th>
                <th class="p-2 border-r border-slate-300 w-24 text-right">จำนวนเงิน</th>
                <th class="p-2 border-r border-slate-300 w-28 text-center">สถานะ</th>
                <th class="p-2 border-r border-slate-300">ถูกใช้โดย</th>
                <th class="p-2 border-r border-slate-300 min-w-[120px]">วันที่เพิ่ม</th>
                <th class="p-2 text-center w-28">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              @for (code of codes(); track code.id) {
                <tr class="border-b border-slate-200 hover:bg-slate-50">
                  <td class="p-2 border-r border-slate-300 font-mono">
                    @if (editingCodeId() === code.id) {
                      <input type="text" [ngModel]="editCode()" (ngModelChange)="editCode.set($event)" class="app-input w-full p-1 text-sm h-8" [disabled]="loading()">
                    } @else {
                      {{ code.id }}
                    }
                  </td>
                  <td class="p-2 border-r border-slate-300 text-right">
                    @if (editingCodeId() === code.id) {
                      <input type="number" [ngModel]="editAmount()" (ngModelChange)="editAmount.set($event)" class="app-input w-20 text-right p-1 text-sm h-8" min="0" [disabled]="loading()">
                    } @else {
                      {{ code.amount }}
                    }
                  </td>
                  <td class="p-2 border-r border-slate-300 text-center">
                    @if (code.isRedeemed) {
                      <span class="text-red-600 font-bold text-xs"><i class="fa-solid fa-check"></i> ถูกใช้แล้ว</span>
                    } @else {
                      <span class="text-green-600 font-bold text-xs">ว่าง</span>
                    }
                  </td>
                  <td class="p-2 border-r border-slate-300 text-xs">
                    @if (code.isRedeemed) {
                      <div class="truncate max-w-[150px]" [title]="code.redeemedEmail">{{ code.redeemedEmail }}</div>
                      <div class="text-slate-500 font-mono text-[10px]" [title]="code.redeemedBy">{{ code.redeemedBy }}</div>
                    } @else {
                      -
                    }
                  </td>
                  <td class="p-2 border-r border-slate-300 text-xs">
                    @if (editingCodeId() === code.id) {
                      <input type="date" [ngModel]="editDonatedAt()" (ngModelChange)="editDonatedAt.set($event)" class="app-input w-full p-1 text-sm h-8" [disabled]="loading()">
                    } @else {
                      <div class="whitespace-nowrap" title="เวลาสร้างระบบ: {{ code.createdAt | date:'dd/MM/yyyy HH:mm' }}">
                        @if (code.donatedAt) {
                          โอน: {{ code.donatedAt | date:'dd/MM/yyyy' }}
                        } @else {
                          สร้าง: {{ code.createdAt | date:'dd/MM/yyyy HH:mm' }}
                        }
                      </div>
                    }
                  </td>
                  <td class="p-2 text-center whitespace-nowrap">
                    <div class="inline-flex items-center gap-2">
                      @if (editingCodeId() === code.id) {
                        <button type="button" class="text-xs text-blue-600 font-bold hover:underline disabled:text-slate-400" (click)="saveEdit(code)" [disabled]="loading()">บันทึก</button>
                        <span class="text-slate-300">|</span>
                        <button type="button" class="text-xs text-slate-600 font-bold hover:underline disabled:text-slate-400" (click)="cancelEdit()" [disabled]="loading()">ยกเลิก</button>
                      } @else {
                        <button type="button" class="text-xs text-blue-600 font-bold hover:underline disabled:text-slate-400" (click)="startEdit(code)" [disabled]="loading()">แก้ไข</button>
                        <span class="text-slate-300">|</span>
                        @if (code.isRedeemed) {
                          <button type="button" class="text-xs text-amber-700 font-bold hover:underline disabled:text-slate-400" (click)="revokeCode(code.id)" [disabled]="loading()">Revoke</button>
                          <span class="text-slate-300">|</span>
                        }
                        <button type="button" class="text-xs text-red-600 font-bold hover:underline disabled:text-slate-400" (click)="deleteCode(code)" [disabled]="loading()">ลบ</button>
                      }
                    </div>
                  </td>
                </tr>
              }
              @if (codes().length === 0) {
                <tr>
                  <td colspan="6" class="p-4 text-center text-slate-500">ไม่มีข้อมูล</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class AdminManageRedeemPageComponent implements OnInit {
  private readonly redeemRepo = inject(RedeemRepository);
  private readonly statusMessage = inject(StatusMessageService);
  private readonly authService = inject(AuthService);

  protected readonly codes = signal<RedeemCode[]>([]);
  protected readonly loading = signal(false);
  
  protected readonly newCode = signal('');
  protected readonly newAmount = signal(0);
  protected readonly newDonatedAt = signal(this.getLocalDateString());

  protected readonly editingCodeId = signal<string | null>(null);
  protected readonly editCode = signal<string>('');
  protected readonly editAmount = signal<number>(0);
  protected readonly editDonatedAt = signal<string>('');

  ngOnInit(): void {
    void this.loadCodes();
  }
  
  private getLocalDateString(): string {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }

  protected async loadCodes(): Promise<void> {
    try {
      const items = await this.redeemRepo.getRecentCodes(100);
      this.codes.set(items);
    } catch (error: any) {
      this.statusMessage.show(error.message || 'ดึงข้อมูลไม่สำเร็จ', 'error');
    }
  }

  protected async syncDonations(): Promise<void> {
    if (!confirm('ต้องการซิงค์ข้อมูลการบริจาคเก่าไปยังระบบใหม่หรือไม่? (โค้ดเก่าที่มีจำนวนเงิน > 0 จะถูกเพิ่มในหน้ารายการบริจาค)')) return;
    this.loading.set(true);
    this.statusMessage.show('กำลังซิงค์ข้อมูล...', 'info');
    try {
      const result = await this.redeemRepo.syncDonations();
      this.statusMessage.show(`ซิงค์ข้อมูลเรียบร้อย จำนวน ${result.synced} รายการ`, 'success');
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
      this.newCode.set('');
      this.newDonatedAt.set(this.getLocalDateString());
      
      // Reload list
      await this.loadCodes();
    } catch (error: any) {
      this.statusMessage.show(error.message || 'เกิดข้อผิดพลาด', 'error');
    } finally {
      this.loading.set(false);
    }
  }

  protected startEdit(code: RedeemCode): void {
    this.editingCodeId.set(code.id);
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
    this.editingCodeId.set(null);
  }

  protected async saveEdit(code: RedeemCode): Promise<void> {
    const newCodeStr = this.editCode();
    const amount = this.editAmount();
    const donatedAtStr = this.editDonatedAt();
    let donatedAtIso: string | undefined;
    if (donatedAtStr) {
      donatedAtIso = new Date(donatedAtStr + 'T00:00:00').toISOString();
    }
    
    this.loading.set(true);
    this.statusMessage.show('กำลังบันทึก...', 'info');
    try {
      await this.redeemRepo.updateCode(code.id, newCodeStr, amount, donatedAtIso);
      this.statusMessage.show('บันทึกเรียบร้อย', 'success');
      this.editingCodeId.set(null);
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
