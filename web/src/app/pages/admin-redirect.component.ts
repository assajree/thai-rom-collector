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

  protected async signIn(): Promise<void> {
    try {
      await this.auth.signInWithGoogle();
      await this.router.navigateByUrl('/', { replaceUrl: true });
    } catch {
      this.status.show('ไม่สามารถเข้าสู่ระบบด้วย Google ได้ กรุณาลองใหม่อีกครั้ง', 'error');
    }
  }

  protected async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl('/', { replaceUrl: true });
  }
}
