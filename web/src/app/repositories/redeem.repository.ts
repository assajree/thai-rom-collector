import { Injectable, inject } from '@angular/core';
import { Database, get, ref, set, update, query, orderByChild, limitToLast } from '@angular/fire/database';
import { RedeemCode } from '../models/redeem.models';
import { RepositoryError } from './repository-error';

@Injectable({ providedIn: 'root' })
export class RedeemRepository {
  private readonly database = inject(Database);

  async getCode(code: string): Promise<RedeemCode | null> {
    const codeStr = code.trim();
    if (!codeStr) return null;
    try {
      const snapshot = await get(ref(this.database, `redeemCodes/${codeStr}`));
      if (!snapshot.exists()) return null;
      return { id: snapshot.key!, ...snapshot.val() } as RedeemCode;
    } catch {
      return null; // Don't throw to prevent leaking errors on unauthenticated read if not allowed
    }
  }

  async redeemCode(code: string, uid: string, email: string): Promise<void> {
    const codeStr = code.trim();
    if (!codeStr) throw new RepositoryError('กรุณากรอกโค้ด', 'update');
    
    try {
      // First, get the code to make sure it exists and get its amount
      // Since rules require amount to be the same, we need the original amount
      const snapshot = await get(ref(this.database, `redeemCodes/${codeStr}`));
      if (!snapshot.exists()) {
        throw new RepositoryError('ไม่พบโค้ดนี้ในระบบ', 'update');
      }
      
      const data = snapshot.val();
      if (data['isRedeemed']) {
        throw new RepositoryError('โค้ดนี้ถูกใช้งานไปแล้ว', 'update');
      }

      const updates: Partial<RedeemCode> = {
        amount: data['amount'], // Required by rule to stay the same
        isRedeemed: true,
        redeemedBy: uid,
        redeemedEmail: email,
        redeemedAt: new Date().toISOString()
      };

      await update(ref(this.database, `redeemCodes/${codeStr}`), updates);
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      throw new RepositoryError('ไม่สามารถใช้งานโค้ดนี้ได้ (ข้อมูลอาจไม่ถูกต้องหรือถูกใช้ไปแล้ว)', 'update');
    }
  }

  async addCode(code: string, amount: number, adminUid: string): Promise<void> {
    const codeStr = code.trim();
    if (!codeStr) throw new RepositoryError('กรุณากรอกโค้ด', 'create');
    if (amount <= 0) throw new RepositoryError('จำนวนเงินต้องมากกว่า 0', 'create');

    try {
      const existing = await get(ref(this.database, `redeemCodes/${codeStr}`));
      if (existing.exists()) {
        throw new RepositoryError('โค้ดนี้มีอยู่ในระบบแล้ว', 'create');
      }

      const data: Omit<RedeemCode, 'id'> = {
        amount,
        isRedeemed: false,
        createdAt: new Date().toISOString(),
        createdBy: adminUid
      };

      await set(ref(this.database, `redeemCodes/${codeStr}`), data);
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      throw new RepositoryError('ไม่สามารถเพิ่มโค้ดได้', 'create');
    }
  }

  async getRecentCodes(limit = 100): Promise<RedeemCode[]> {
    try {
      const q = query(ref(this.database, 'redeemCodes'), orderByChild('createdAt'), limitToLast(limit));
      const snapshot = await get(q);
      const items: RedeemCode[] = [];
      snapshot.forEach((child) => {
        items.push({ id: child.key!, ...child.val() });
      });
      return items.reverse(); // Newest first
    } catch {
      throw new RepositoryError('ไม่สามารถดึงข้อมูลโค้ดได้', 'read');
    }
  }
}
