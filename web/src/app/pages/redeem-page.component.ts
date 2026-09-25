import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { RedeemRepository } from '../repositories/redeem.repository';
import { StatusMessageService } from '../shared/status-message.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-redeem-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="px-4 py-6 sm:px-6">
      <div class="retro-window max-w-md mx-auto">
        <div class="retro-window-titlebar">
          <h1 class="retro-window-title">VIP Redeem (แลกโค้ด VIP)</h1>
        </div>
        <div class="retro-window-content">
          @if (!authService.user()) {
            <p class="mb-4 text-sm font-bold">คุณต้องเข้าสู่ระบบก่อนจึงจะสามารถ Redeem ได้</p>
            <button type="button" class="retro-system-button w-full text-center justify-center font-bold" (click)="signIn()">
              <i class="fa-brands fa-google mr-2"></i> เข้าสู่ระบบด้วย Google
            </button>
          } @else if (authService.isVip()) {
            <div class="text-center py-4">
              <i class="fa-solid fa-crown text-4xl text-yellow-500 mb-2"></i>
              <p class="font-bold text-lg">คุณเป็นสมาชิก VIP อยู่แล้ว</p>
              <p class="text-sm mt-2">ขอบคุณที่สนับสนุนเซิร์ฟเวอร์ของเรา!</p>
            </div>
          } @else {
            <form (ngSubmit)="submit()" class="flex flex-col gap-4">
              <div class="text-sm mb-4">
                <p class="mb-2">สนับสนุนเซิร์ฟเวอร์และรับโค้ด Redeem (Transaction No.) เพื่อรับสถานะ VIP โดยสมาชิก VIP จะได้รับสิทธิพิเศษดังนี้:</p>
                <ul class="list-disc pl-5 font-bold text-blue-800 space-y-1">
                  <li>ดึงข้อมูลล่าสุดได้เมื่อต้องการ</li>
                  <li>เข้าถึงเว็บไซต์ตอนปิดปรับปรุงได้</li>
                </ul>
              </div>
              
              <div>
                <label for="code" class="mb-1 block font-bold">รหัสอ้างอิง (Transaction No.)</label>
                <input id="code" name="code" type="text" [(ngModel)]="code" required class="app-input w-full" placeholder="เช่น T123456789" [disabled]="loading()">
              </div>
              
              <button type="submit" class="retro-system-button w-full text-center justify-center font-bold" [disabled]="!code() || loading()">
                {{ loading() ? 'กำลังตรวจสอบ...' : 'Redeem รับสถานะ VIP' }}
              </button>
            </form>
          }
        </div>
      </div>
    </div>
  `
})
export class RedeemPageComponent {
  protected readonly authService = inject(AuthService);
  private readonly redeemRepo = inject(RedeemRepository);
  private readonly statusMessage = inject(StatusMessageService);
  
  protected readonly code = signal('');
  protected readonly loading = signal(false);

  protected async signIn(): Promise<void> {
    try {
      await this.authService.signInWithGoogle();
    } catch {
      this.statusMessage.show('ไม่สามารถเข้าสู่ระบบได้', 'error');
    }
  }

  protected async submit(): Promise<void> {
    const user = this.authService.user();
    if (!user) return;
    
    const codeVal = this.code().trim();
    if (!codeVal) return;

    this.loading.set(true);
    this.statusMessage.show('กำลังตรวจสอบโค้ด...', 'info');

    try {
      await this.redeemRepo.redeemCode(codeVal, user.uid, user.email ?? '');
      
      this.statusMessage.show('Redeem สำเร็จ! คุณได้รับสถานะ VIP แล้ว โปรดรีเฟรชหน้าเว็บหากสถานะยังไม่อัปเดต', 'success');
      this.code.set('');
      
      // We can force reload or just wait for the RTDB subscription in authService to catch the new VIP state.
      // Usually, the Firebase RTDB listener will automatically trigger and update `isVip` immediately.
    } catch (error: any) {
      this.statusMessage.show(error.message || 'เกิดข้อผิดพลาด', 'error');
    } finally {
      this.loading.set(false);
    }
  }
}
