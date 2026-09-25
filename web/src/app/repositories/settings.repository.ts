import { Injectable, inject } from '@angular/core';
import { Database, get, ref, update } from '@angular/fire/database';

@Injectable({ providedIn: 'root' })
export class SettingsRepository {
  private readonly database = inject(Database);

  async getMaintenanceMode(): Promise<boolean> {
    try {
      const snapshot = await get(ref(this.database, 'settings/maintenanceMode'));
      return snapshot.exists() ? Boolean(snapshot.val()) : false;
    } catch (error) {
      console.error('Failed to get maintenance mode', error);
      return false; // Default to false if error
    }
  }

  async setMaintenanceMode(enabled: boolean): Promise<void> {
    await update(ref(this.database, 'settings'), { maintenanceMode: enabled });
  }
}
