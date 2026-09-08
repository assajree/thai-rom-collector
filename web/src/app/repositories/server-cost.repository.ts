import { Injectable, inject } from '@angular/core';
import { Database, get, ref, update } from '@angular/fire/database';

@Injectable({ providedIn: 'root' })
export class ServerCostRepository {
  private readonly database = inject(Database);

  async read(): Promise<number> {
    const snapshot = await get(ref(this.database, 'settings/serverCost'));
    const value = Number(snapshot.val());
    return Number.isFinite(value) && value >= 0 ? value : 0;
  }

  async update(monthlyCost: number): Promise<void> {
    if (!Number.isFinite(monthlyCost) || monthlyCost < 0) throw new Error('กรุณาระบุค่าเซิร์ฟเวอร์เป็นตัวเลขที่ไม่ติดลบ');
    await update(ref(this.database, 'settings'), { serverCost: Math.round(monthlyCost * 100) / 100 });
  }
}
