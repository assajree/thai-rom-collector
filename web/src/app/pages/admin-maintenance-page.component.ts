import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SettingsRepository } from '../repositories/settings.repository';
import { StatusMessageService } from '../shared/status-message.service';

@Component({
  selector: 'app-admin-maintenance-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-maintenance-page.component.html',
  styleUrl: './admin-maintenance-page.component.css'
})
export class AdminMaintenancePageComponent {
  private readonly settingsRepository = inject(SettingsRepository);
  private readonly status = inject(StatusMessageService);

  protected readonly maintenanceMode = signal(false);
  protected loading = true;
  protected saving = false;

  constructor() {
    this.loadSettings();
  }

  private async loadSettings() {
    this.loading = true;
    try {
      const mode = await this.settingsRepository.getMaintenanceMode();
      this.maintenanceMode.set(mode);
    } catch (error) {
      this.status.show('ไม่สามารถโหลดข้อมูลการตั้งค่าได้', 'error');
    } finally {
      this.loading = false;
    }
  }

  protected async save() {
    if (this.saving) return;
    this.saving = true;
    this.status.show('กำลังบันทึก...');
    try {
      await this.settingsRepository.setMaintenanceMode(this.maintenanceMode());
      this.status.show('บันทึกการตั้งค่าแล้ว', 'success');
    } catch (error) {
      this.status.show('ไม่สามารถบันทึกการตั้งค่าได้', 'error');
    } finally {
      this.saving = false;
    }
  }
}
