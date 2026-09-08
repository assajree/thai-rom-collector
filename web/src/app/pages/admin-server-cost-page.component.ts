import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { StatusMessageService } from '../shared/status-message.service';
import { ServerCostRepository } from '../repositories/server-cost.repository';

@Component({
  selector: 'app-admin-server-cost-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-server-cost-page.component.html',
  styleUrl: './admin-server-cost-page.component.css'
})
export class AdminServerCostPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly status = inject(StatusMessageService);
  private readonly repository = inject(ServerCostRepository);
  protected monthlyCost = 0;
  protected loading = true;
  protected saving = false;

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    try { this.monthlyCost = await this.repository.read(); }
    catch { this.status.show('ไม่สามารถโหลดค่าเซิร์ฟเวอร์ได้', 'error'); }
    finally { this.loading = false; }
  }

  protected async save(): Promise<void> {
    if (this.saving || this.loading) return;
    this.saving = true;
    this.status.show('กำลังบันทึกค่าเซิร์ฟเวอร์…');
    try {
      await this.repository.update(Number(this.monthlyCost));
      this.status.show('บันทึกค่าเซิร์ฟเวอร์สำเร็จ', 'success');
    } catch (error) {
      this.status.show(error instanceof Error ? error.message : 'ไม่สามารถบันทึกค่าเซิร์ฟเวอร์ได้', 'error');
    } finally { this.saving = false; }
  }

  protected async signOut(): Promise<void> { await this.auth.signOut(); await this.router.navigateByUrl('/', { replaceUrl: true }); }
}
