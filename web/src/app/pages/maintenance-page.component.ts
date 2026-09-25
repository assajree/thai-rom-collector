import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-maintenance-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './maintenance-page.component.html',
  styleUrl: './maintenance-page.component.css'
})
export class MaintenancePageComponent {
  protected readonly authService = inject(AuthService);
  protected loading = false;

  protected async signIn(): Promise<void> {
    this.loading = true;
    try {
      await this.authService.signInWithGoogle();
      // ไม่ต้อง redirect ด้วยมือ เพราะ auth state จะเปลี่ยนและเดี๋ยว User กดรีเฟรชหรือไปหน้าแรกเอง
      // หรืออาจจะสั่ง reload เพื่อให้เข้า Guard ใหม่
      window.location.href = '/';
    } catch {
      this.loading = false;
    }
  }
}
