import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { StatusMessageService } from './shared/status-message.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  protected readonly statusMessageService = inject(StatusMessageService);
  protected readonly authService = inject(AuthService);
  protected readonly statusMessage = this.statusMessageService.message;
  protected readonly platforms = ['All systems', '3DS', 'GBA', 'NDS', 'PSP'];
  protected readonly selectedPlatform = signal('All systems');

  protected selectPlatform(platform: string): void {
    this.selectedPlatform.set(platform);
  }

  protected async signIn(): Promise<void> {
    try {
      await this.authService.signInWithGoogle();
      this.statusMessageService.show('เข้าสู่ระบบแล้ว กำลังตรวจสอบสิทธิ์ผู้ดูแลระบบ');
    } catch {
      this.statusMessageService.show('ไม่สามารถเข้าสู่ระบบด้วย Google ได้ กรุณาลองใหม่อีกครั้ง', 'error');
    }
  }

  protected async signOut(): Promise<void> {
    await this.authService.signOut();
    this.statusMessageService.show('ออกจากระบบแล้ว');
  }
}
