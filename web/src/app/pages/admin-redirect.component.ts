import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { StatusMessageService } from '../shared/status-message.service';

@Component({
  selector: 'app-admin-redirect',
  standalone: true,
  templateUrl: './admin-redirect.component.html',
  styleUrl: './admin-redirect.component.css'
})
export class AdminRedirectComponent {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);
  private readonly status = inject(StatusMessageService);

  constructor() {
    if (this.auth.user()) void this.resolveExistingSession();
  }

  private async resolveExistingSession(): Promise<void> {
    if (await this.auth.waitForAdminCheck()) {
      await this.router.navigateByUrl('/add-patch', { replaceUrl: true });
    } else {
      this.status.show('บัญชีนี้ยังไม่ได้รับสิทธิ์ผู้ดูแลระบบ', 'error');
    }
  }

  protected async signIn(): Promise<void> {
    try {
      await this.auth.signInWithGoogle();
      if (await this.auth.waitForAdminCheck()) await this.router.navigateByUrl('/add-patch', { replaceUrl: true });
      else this.status.show('บัญชีนี้ยังไม่ได้รับสิทธิ์ผู้ดูแลระบบ', 'error');
    } catch {
      this.status.show('ไม่สามารถเข้าสู่ระบบด้วย Google ได้ กรุณาลองใหม่อีกครั้ง', 'error');
    }
  }
}
