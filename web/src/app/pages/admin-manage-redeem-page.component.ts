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
              <label for="newCode" class="block font-bold mb-1">Transaction No. (รหัสอ้างอิง)</label>
              <input id="newCode" name="newCode" type="text" [(ngModel)]="newCode" required class="app-input w-full" placeholder="T123456789" [disabled]="loading()">
            </div>
            <div class="w-full sm:w-32">
              <label for="newAmount" class="block font-bold mb-1">จำนวนเงิน</label>
              <input id="newAmount" name="newAmount" type="number" [(ngModel)]="newAmount" required min="0" class="app-input w-full" [disabled]="loading()" (focus)="$any($event.target).select()">
            </div>
            <div class="w-full sm:w-56">
              <label for="newDonatedAt" class="block font-bold mb-1 flex justify-between items-end">
                <span>เวลาที่โอน (ตัวเลือก)</span>
                <button type="button" class="text-xs text-blue-600 hover:underline disabled:text-slate-400 disabled:no-underline" (click)="extractTimeFromCode()" [disabled]="!newCode() || loading()">ดึงจากโค้ด</button>
              </label>
              <input id="newDonatedAt" name="newDonatedAt" type="datetime-local" step="1" [(ngModel)]="newDonatedAt" class="app-input w-full" [disabled]="loading()">
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
          <button type="button" class="no-button text-black ml-auto" (click)="loadCodes()" aria-label="รีเฟรช">
            <i class="fa-solid fa-rotate-right"></i>
          </button>
        </div>
        <div class="retro-window-content overflow-x-auto p-0">
          <table class="w-full text-left text-sm border-collapse">
            <thead>
              <tr class="bg-slate-200 border-b-2 border-slate-400">
                <th class="p-2 border-r border-slate-300">Transaction No.</th>
                <th class="p-2 border-r border-slate-300 w-24 text-right">จำนวนเงิน</th>
                <th class="p-2 border-r border-slate-300 w-28 text-center">สถานะ</th>
                <th class="p-2 border-r border-slate-300">ถูกใช้โดย</th>
                <th class="p-2 min-w-[120px]">วันที่เพิ่ม</th>
              </tr>
            </thead>
            <tbody>
              @for (code of codes(); track code.id) {
                <tr class="border-b border-slate-200 hover:bg-slate-50">
                  <td class="p-2 border-r border-slate-300 font-mono">{{ code.id }}</td>
                  <td class="p-2 border-r border-slate-300 text-right">{{ code.amount }}</td>
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
                  <td class="p-2 text-xs">
                    <div class="whitespace-nowrap" title="เวลาสร้างระบบ: {{ code.createdAt | date:'dd/MM/yyyy HH:mm' }}">
                      @if (code.donatedAt) {
                        โอน: {{ code.donatedAt | date:'dd/MM/yyyy HH:mm' }}
                      } @else {
                        สร้าง: {{ code.createdAt | date:'dd/MM/yyyy HH:mm' }}
                      }
                    </div>
                  </td>
                </tr>
              }
              @if (codes().length === 0) {
                <tr>
                  <td colspan="5" class="p-4 text-center text-slate-500">ไม่มีข้อมูล</td>
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
  protected readonly newDonatedAt = signal(this.getLocalDatetimeString());

  ngOnInit(): void {
    void this.loadCodes();
  }
  
  private getLocalDatetimeString(): string {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 19);
  }

  protected async loadCodes(): Promise<void> {
    try {
      const items = await this.redeemRepo.getRecentCodes(100);
      this.codes.set(items);
    } catch (error: any) {
      this.statusMessage.show(error.message || 'ดึงข้อมูลไม่สำเร็จ', 'error');
    }
  }

  protected extractTimeFromCode(): void {
    const code = this.newCode().trim();
    // Pattern: 14 digits at the beginning (YYYYMMDDHHmmss)
    const match = code.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
    if (match) {
      const [, year, month, day, hour, min, sec] = match;
      this.newDonatedAt.set(`${year}-${month}-${day}T${hour}:${min}:${sec}`);
      this.statusMessage.show(`ดึงเวลาสำเร็จ: ${day}/${month}/${year} ${hour}:${min}:${sec}`, 'success');
    } else {
      this.statusMessage.show('ไม่สามารถดึงเวลาได้ (รูปแบบโค้ดไม่ตรงกัน)', 'error');
    }
  }

  protected async addCode(): Promise<void> {
    const code = this.newCode().trim();
    const amount = this.newAmount();
    const donatedAtStr = this.newDonatedAt();
    
    // convert datetime-local string to ISO if exists, otherwise undefined
    let donatedAtIso: string | undefined;
    if (donatedAtStr) {
      donatedAtIso = new Date(donatedAtStr).toISOString();
    }
    
    const adminProfile = this.authService.getAdminProfile();

    if (!code || amount < 0 || !adminProfile) return;

    this.loading.set(true);
    this.statusMessage.show('กำลังเพิ่มโค้ด...', 'info');

    try {
      await this.redeemRepo.addCode(code, amount, adminProfile.uid, donatedAtIso);
      this.statusMessage.show(`เพิ่มโค้ด ${code} สำเร็จ`, 'success');
      this.newCode.set('');
      this.newDonatedAt.set(this.getLocalDatetimeString());
      
      // Reload list
      await this.loadCodes();
    } catch (error: any) {
      this.statusMessage.show(error.message || 'เกิดข้อผิดพลาด', 'error');
    } finally {
      this.loading.set(false);
    }
  }
}
