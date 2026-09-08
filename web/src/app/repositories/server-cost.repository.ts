import { Injectable, inject } from '@angular/core';
import { Database, get, ref, update } from '@angular/fire/database';

const SERVER_COST_STORAGE_KEY = 'rom-collector:server-cost';

@Injectable({ providedIn: 'root' })
export class ServerCostRepository {
  private readonly database = inject(Database);

  getCached(): number | null {
    try {
      const raw = window.localStorage.getItem(SERVER_COST_STORAGE_KEY);
      if (raw !== null && raw !== '') {
        const value = Number(raw);
        if (Number.isFinite(value) && value >= 0) return value;
      }
    } catch {
      // storage can be unavailable
    }
    return null;
  }

  async read(): Promise<number> {
    try {
      const snapshot = await get(ref(this.database, 'settings/serverCost'));
      const value = Number(snapshot.val());
      const result = Number.isFinite(value) && value >= 0 ? value : 0;
      try {
        window.localStorage.setItem(SERVER_COST_STORAGE_KEY, String(result));
      } catch {
        // storage can be unavailable
      }
      return result;
    } catch (error) {
      const cached = this.getCached();
      if (cached !== null) return cached;
      throw error;
    }
  }

  async update(monthlyCost: number): Promise<void> {
    if (!Number.isFinite(monthlyCost) || monthlyCost < 0) throw new Error('กรุณาระบุค่าเซิร์ฟเวอร์เป็นตัวเลขที่ไม่ติดลบ');
    const rounded = Math.round(monthlyCost * 100) / 100;
    await update(ref(this.database, 'settings'), { serverCost: rounded });
    try {
      window.localStorage.setItem(SERVER_COST_STORAGE_KEY, String(rounded));
    } catch {
      // storage can be unavailable
    }
  }
}
