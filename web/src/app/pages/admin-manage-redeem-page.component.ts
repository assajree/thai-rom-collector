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
  template: `
    <div class="px-2.5 py-4 sm:px-6 sm:py-6 manage-redeem-container">
      <div class="mb-4">
        <h1 class="text-xl sm:text-2xl font-bold">จัดการโค้ด Redeem</h1>
      </div>

      <!-- Tab Switcher -->
      <nav class="redeem-tabs" role="tablist" aria-label="เมนูจัดการโค้ด Redeem">
        <button
          type="button"
          role="tab"
          id="tab-add"
          aria-controls="panel-add"
          [attr.aria-selected]="activeTab() === 'add'"
          class="tab-btn"
          [class.tab-btn--active]="activeTab() === 'add'"
          (click)="switchTab('add')">
          <i class="fa-solid fa-plus mr-1" aria-hidden="true"></i>
          <span>เพิ่มโค้ด Redeem</span>
        </button>
        <button
          type="button"
          role="tab"
          id="tab-list"
          aria-controls="panel-list"
          [attr.aria-selected]="activeTab() === 'list'"
          class="tab-btn"
          [class.tab-btn--active]="activeTab() === 'list'"
          (click)="switchTab('list')">
          <i class="fa-solid fa-list mr-1" aria-hidden="true"></i>
          <span>รายการโค้ดล่าสุด</span>
          @if (codesLoaded()) {
            <span class="tab-count-badge">{{ codes().length }}</span>
          }
        </button>
      </nav>

      <!-- Tab 1: เพิ่มโค้ด Redeem -->
      @if (activeTab() === 'add') {
        <section role="tabpanel" id="panel-add" aria-labelledby="tab-add" class="card-window p-3.5 sm:p-6">
          <h2 class="text-base sm:text-lg font-bold mb-4">เพิ่มโค้ด Redeem ใหม่</h2>
          <form (ngSubmit)="addCode()" class="flex flex-col gap-4 max-w-xl w-full min-w-0">
            <div class="w-full min-w-0">
              <label for="newCode" class="block font-bold mb-1 break-words">รหัส Redeem (วันเวลาที่โอน YYYYMMDDHHmm)</label>
              <input id="newCode" name="newCode" type="text" [(ngModel)]="newCode" required class="app-input w-full" placeholder="เช่น 202609241105" [disabled]="loading()">
            </div>
            <div class="w-full min-w-0">
              <label for="newAmount" class="block font-bold mb-1">จำนวนเงิน</label>
              <input id="newAmount" name="newAmount" type="number" [(ngModel)]="newAmount" required min="0" class="app-input w-full" [disabled]="loading()" (focus)="$any($event.target).select()">
            </div>
            <div class="w-full min-w-0">
              <label for="newDonatedAt" class="block font-bold mb-1">วันที่โอน (ตัวเลือก)</label>
              <input id="newDonatedAt" name="newDonatedAt" type="date" [(ngModel)]="newDonatedAt" class="app-input w-full" [disabled]="loading()">
            </div>
            <div class="pt-2">
              <button type="submit" class="button border btn-primary font-bold h-[42px] px-6" [disabled]="!newCode() || newAmount() < 0 || loading()">
                <i class="fa-solid fa-plus mr-1" aria-hidden="true"></i> เพิ่มโค้ด
              </button>
            </div>
          </form>
        </section>
      }

      <!-- Tab 2: รายการโค้ดล่าสุด -->
      @if (activeTab() === 'list') {
        <section role="tabpanel" id="panel-list" aria-labelledby="tab-list" class="card-window">
          <div class="card-titlebar">
            <h2 class="text-base sm:text-lg font-bold">
              รายการโค้ดล่าสุด
              @if (codesLoaded()) {
                <span class="text-sm font-normal text-[var(--color-text-muted)]">({{ codes().length }} รายการ)</span>
              }
            </h2>
            <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button type="button" class="button border px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-bold" (click)="syncDonations()" [disabled]="loading() || listLoading()" title="ซิงค์ข้อมูลการบริจาคย้อนหลัง">
                <i class="fa-solid fa-cloud-arrow-up mr-1" aria-hidden="true"></i> Sync
              </button>
              <button type="button" class="button border px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-bold" (click)="loadCodes()" [disabled]="loading() || listLoading()" title="รีเฟรชข้อมูล">
                <i class="fa-solid fa-rotate-right mr-1" [class.fa-spin]="listLoading()" aria-hidden="true"></i> รีเฟรช
              </button>
            </div>
          </div>

          @if (listLoading() && !codesLoaded()) {
            <div class="p-8 sm:p-10 text-center" role="status" aria-live="polite">
              <i class="fa-solid fa-circle-notch fa-spin text-3xl mb-3 text-[var(--color-accent)]" aria-hidden="true"></i>
              <p class="text-sm font-bold text-[var(--color-text-muted)]">กำลังโหลดข้อมูลโค้ด...</p>
            </div>
          } @else {
            <div class="p-2.5 sm:p-6 space-y-2.5 sm:space-y-3">
              @for (code of codes(); track code.id) {
                <article class="code-row-card">
                  <div class="flex flex-col gap-2 w-full min-w-0">
                    <!-- Top Row: Badge, Code, and Amount -->
                    <div class="flex items-center justify-between gap-2 flex-wrap min-w-0">
                      <div class="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
                        @if (code.isRedeemed) {
                          <span class="badge-redeemed shrink-0"><i class="fa-solid fa-check mr-1" aria-hidden="true"></i>ถูกใช้แล้ว</span>
                        } @else {
                          <span class="badge-available shrink-0"><i class="fa-solid fa-circle-check mr-1" aria-hidden="true"></i>ว่าง</span>
                        }
                        <span class="font-mono text-sm sm:text-base font-bold text-[var(--color-highlight)] select-all whitespace-nowrap">
                          {{ code.id }}
                        </span>
                      </div>

                      <div class="text-right whitespace-nowrap shrink-0 ml-auto">
                        <span class="font-bold text-base text-[var(--color-text)]">{{ code.amount }}</span>
                        <span class="text-xs text-[var(--color-text-muted)] ml-1">บาท</span>
                      </div>
                    </div>

                    <!-- Middle Row: Dates and User Info (if redeemed) -->
                    <div class="flex items-center justify-between gap-x-3 gap-y-1 text-xs text-[var(--color-text-muted)] flex-wrap min-w-0">
                      <div class="flex items-center gap-x-2 gap-y-1 flex-wrap min-w-0">
                        <span class="inline-flex items-center gap-1.5 whitespace-nowrap">
                          <i class="fa-regular fa-clock opacity-70" aria-hidden="true"></i>
                          <span>
                            @if (code.donatedAt) {
                              โอน: {{ code.donatedAt | date:'dd/MM/yyyy' }}
                            } @else {
                              สร้าง: {{ code.createdAt | date:'dd/MM/yyyy HH:mm' }}
                            }
                          </span>
                        </span>
                        @if (code.isRedeemed && code.redeemedAt) {
                          <span class="opacity-40 hidden sm:inline">-</span>
                          <span class="whitespace-nowrap">ใช้เมื่อ: {{ code.redeemedAt | date:'dd/MM/yyyy HH:mm' }}</span>
                        }
                      </div>

                      @if (code.isRedeemed && (code.redeemedEmail || code.redeemedBy)) {
                        <div class="flex items-center gap-1.5 min-w-0 max-w-full" [title]="'UID: ' + code.redeemedBy">
                          <i class="fa-regular fa-envelope text-[var(--color-accent)] shrink-0" aria-hidden="true"></i>
                          <span class="text-[var(--color-text)] font-semibold truncate max-w-[180px] sm:max-w-[280px]">
                            {{ code.redeemedEmail || code.redeemedBy }}
                          </span>
                        </div>
                      }
                    </div>

                    <!-- Bottom Row: Action Buttons -->
                    <div class="flex items-center justify-end gap-1.5 sm:gap-2 pt-2 border-t border-[var(--color-border)]/40 flex-wrap">
                      <button type="button" class="button border px-2.5 py-1 text-xs font-bold" (click)="startEdit(code)" [disabled]="loading()">
                        <i class="fa-solid fa-pen-to-square mr-1" aria-hidden="true"></i>แก้ไข
                      </button>
                      @if (code.isRedeemed) {
                        <button type="button" class="button border px-2.5 py-1 text-xs font-bold text-amber-400 hover:text-amber-300" (click)="revokeCode(code.id)" [disabled]="loading()" title="ยกเลิกการใช้งานโค้ด">
                          <i class="fa-solid fa-rotate-left mr-1" aria-hidden="true"></i>Revoke
                        </button>
                      }
                      <button type="button" class="button border px-2.5 py-1 text-xs font-bold text-red-400 hover:text-red-300" (click)="deleteCode(code)" [disabled]="loading()" title="ลบโค้ด">
                        <i class="fa-solid fa-trash mr-1" aria-hidden="true"></i>ลบ
                      </button>
                    </div>
                  </div>
                </article>
              }

              @if (codes().length === 0) {
                <div class="p-8 text-center text-[var(--color-text-muted)]">
                  <i class="fa-solid fa-ticket-simple text-3xl mb-2 opacity-50 block" aria-hidden="true"></i>
                  <p>ไม่มีข้อมูลโค้ด</p>
                </div>
              }
            </div>
          }
        </section>
      }

      <!-- Edit Modal Popup -->
      @if (editingCode(); as code) {
        <div class="popup-backdrop" role="presentation" (click)="cancelEdit()">
          <section class="popup-dialog" role="dialog" aria-modal="true" aria-labelledby="edit-dialog-title" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between pb-3 mb-4 border-b border-[var(--color-border)]">
              <h2 id="edit-dialog-title" class="text-base sm:text-lg font-bold flex items-center gap-2">
                <i class="fa-solid fa-pen-to-square text-[var(--color-accent)]" aria-hidden="true"></i>
                <span>แก้ไขโค้ด Redeem</span>
              </h2>
              <button
                type="button"
                class="text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-1 text-base leading-none cursor-pointer"
                (click)="cancelEdit()"
                [disabled]="loading()"
                aria-label="ปิดหน้าต่าง">
                <i class="fa-solid fa-xmark" aria-hidden="true"></i>
              </button>
            </div>

            <form (ngSubmit)="saveEdit(code)" class="space-y-4">
              <div>
                <label for="edit-code-input" class="block text-xs font-bold text-[var(--color-text-muted)] mb-1">รหัส Redeem</label>
                <input
                  id="edit-code-input"
                  type="text"
                  [ngModel]="editCode()"
                  (ngModelChange)="editCode.set($event)"
                  name="editCode"
                  class="app-input w-full font-mono text-sm sm:text-base"
                  [disabled]="loading()"
                  required>
              </div>

              <div>
                <label for="edit-amount-input" class="block text-xs font-bold text-[var(--color-text-muted)] mb-1">จำนวนเงิน (บาท)</label>
                <input
                  id="edit-amount-input"
                  type="number"
                  [ngModel]="editAmount()"
                  (ngModelChange)="editAmount.set($event)"
                  name="editAmount"
                  class="app-input w-full text-sm sm:text-base"
                  min="0"
                  [disabled]="loading()"
                  required>
              </div>

              <div>
                <label for="edit-donated-input" class="block text-xs font-bold text-[var(--color-text-muted)] mb-1">วันที่โอน</label>
                <input
                  id="edit-donated-input"
                  type="date"
                  [ngModel]="editDonatedAt()"
                  (ngModelChange)="editDonatedAt.set($event)"
                  name="editDonatedAt"
                  class="app-input w-full text-sm sm:text-base"
                  [disabled]="loading()">
              </div>

              <div class="mt-6 pt-3 border-t border-[var(--color-border)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  class="button border px-3 py-1.5 text-xs font-bold"
                  (click)="cancelEdit()"
                  [disabled]="loading()">
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  class="button border btn-primary px-4 py-1.5 text-xs font-bold text-ink"
                  [disabled]="loading() || !editCode().trim()">
                  <i class="fa-solid fa-check mr-1" aria-hidden="true"></i>บันทึก
                </button>
              </div>
            </form>
          </section>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      max-width: 100%;
      min-width: 0;
      box-sizing: border-box;
      overflow-x: clip;
    }
    .manage-redeem-container {
      box-sizing: border-box;
      width: 100%;
      max-width: min(64rem, 100%);
      min-width: 0;
      margin: 0 auto;
      overflow-x: clip;
    }
    .redeem-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      border-bottom: 2px solid var(--color-border);
      margin-bottom: 1.25rem;
      width: 100%;
      max-width: 100%;
      min-width: 0;
      box-sizing: border-box;
    }
    .tab-btn {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-bottom: 1px solid transparent;
      color: var(--color-text-muted);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      font-size: 0.85rem;
      font-weight: 700;
      padding: 0.5rem 0.6rem;
      border-top-left-radius: 6px;
      border-top-right-radius: 6px;
      min-height: 40px;
      transition: background-color 0.15s ease, color 0.15s ease;
      box-sizing: border-box;
      flex: 1 1 0;
      min-width: 0;
      white-space: nowrap;
    }
    @media (min-width: 640px) {
      .redeem-tabs {
        gap: 0.5rem;
        margin-bottom: 1.5rem;
      }
      .tab-btn {
        flex: 0 0 auto;
        font-size: 1rem;
        padding: 0.6rem 1.25rem;
        min-height: 42px;
      }
    }
    .tab-btn:hover {
      color: var(--color-text);
      background: var(--color-surface-light);
    }
    .tab-btn--active {
      background: var(--color-surface-light);
      color: var(--color-highlight);
      border-bottom: none;
      box-shadow: 0 -2px 0 var(--color-highlight);
    }
    .tab-count-badge {
      background: rgba(255, 255, 255, 0.15);
      color: inherit;
      font-size: 0.75rem;
      padding: 0.1rem 0.4rem;
      border-radius: 9999px;
      line-height: 1;
    }
    .card-window {
      background: var(--color-surface-light);
      border: 1px solid var(--color-border);
      box-shadow: 3px 3px 0 var(--color-shadow);
      width: 100%;
      max-width: 100%;
      min-width: 0;
      box-sizing: border-box;
    }
    @media (min-width: 640px) {
      .card-window {
        box-shadow: 4px 4px 0 var(--color-shadow);
      }
    }
    .card-titlebar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.5rem;
      padding: 0.6rem 0.75rem;
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
      box-sizing: border-box;
      width: 100%;
      max-width: 100%;
      min-width: 0;
    }
    @media (min-width: 640px) {
      .card-titlebar {
        gap: 0.75rem;
        padding: 0.75rem 1rem;
      }
    }
    .code-row-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      box-shadow: 2px 2px 0 var(--color-shadow);
      padding: 0.75rem;
      width: 100%;
      max-width: 100%;
      min-width: 0;
      box-sizing: border-box;
      transition: transform 0.1s ease, box-shadow 0.1s ease;
    }
    @media (min-width: 640px) {
      .code-row-card {
        padding: 0.85rem 1rem;
      }
    }
    .code-row-card:hover {
      transform: translateY(-1px);
      box-shadow: 3px 3px 0 var(--color-shadow);
    }
    .badge-available {
      display: inline-flex;
      align-items: center;
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--color-status-success);
      background: color-mix(in srgb, var(--color-status-success) 15%, transparent);
      border: 1px solid var(--color-status-success);
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      line-height: 1.2;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .badge-redeemed {
      display: inline-flex;
      align-items: center;
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--color-status-error);
      background: color-mix(in srgb, var(--color-status-error) 15%, transparent);
      border: 1px solid var(--color-status-error);
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      line-height: 1.2;
      white-space: nowrap;
      flex-shrink: 0;
    }
    @media (min-width: 640px) {
      .badge-available,
      .badge-redeemed {
        font-size: 0.75rem;
        padding: 0.15rem 0.5rem;
      }
    }
    .app-input {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      color: var(--color-text);
      padding: 0.5rem;
      box-sizing: border-box;
      width: 100%;
      max-width: 100%;
      min-width: 0;
    }
    .app-input:focus {
      outline: 2px solid var(--color-accent);
    }
    .popup-backdrop {
      position: fixed;
      inset: 0;
      z-index: 50;
      display: grid;
      place-items: center;
      padding: 1rem;
      background: var(--color-overlay);
      backdrop-filter: blur(2px);
      box-sizing: border-box;
    }
    .popup-dialog {
      position: relative;
      z-index: 51;
      width: min(100%, 28rem);
      max-width: calc(100vw - 2rem);
      border: 2px solid var(--color-accent);
      background: var(--color-surface);
      box-shadow: 4px 4px 0 var(--color-shadow);
      padding: 1.25rem 1.25rem;
      color: var(--color-text);
      box-sizing: border-box;
    }
    @media (min-width: 640px) {
      .popup-dialog {
        box-shadow: 6px 6px 0 var(--color-shadow);
        padding: 1.25rem 1.5rem;
      }
    }
  `]
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
  
  protected readonly newCode = signal('');
  protected readonly newAmount = signal(0);
  protected readonly newDonatedAt = signal(this.getLocalDateString());

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
      this.newCode.set('');
      this.newDonatedAt.set(this.getLocalDateString());
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
