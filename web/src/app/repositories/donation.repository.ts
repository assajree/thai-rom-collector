import { Injectable, inject } from '@angular/core';
import { Database, get, ref, query, orderByChild } from '@angular/fire/database';
import { Donation } from '../models/donation.models';
import { RepositoryError } from './repository-error';

@Injectable({ providedIn: 'root' })
export class DonationRepository {
  private readonly database = inject(Database);

  async getAllDonations(): Promise<Donation[]> {
    try {
      const q = query(ref(this.database, 'donations'), orderByChild('donatedAt'));
      const snapshot = await get(q);
      const items: Donation[] = [];
      snapshot.forEach((child) => {
        items.push({ id: child.key!, ...child.val() });
      });
      return items.reverse(); // Newest first
    } catch {
      throw new RepositoryError('ไม่สามารถดึงข้อมูลการบริจาคได้', 'read');
    }
  }
}
