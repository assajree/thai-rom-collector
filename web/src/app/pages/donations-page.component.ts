import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { DonationRepository } from '../repositories/donation.repository';
import { Donation } from '../models/donation.models';
import { StatusMessageService } from '../shared/status-message.service';

interface MonthGroup {
  key: string;   // "current" | "other"
  label: string; // "เดือนนี้" | "เดือนอื่นๆ"
  totalAmount: number;
  donations: Donation[];
}

@Component({
  selector: 'app-donations-page',
  standalone: true,
  imports: [CommonModule, DecimalPipe, RouterLink],
  templateUrl: './donations-page.component.html',
  styleUrl: './donations-page.component.css'
})
export class DonationsPageComponent implements OnInit {
  private readonly donationRepo = inject(DonationRepository);
  private readonly statusMessage = inject(StatusMessageService);
  private readonly titleService = inject(Title);

  protected readonly loading = signal(true);
  protected readonly donations = signal<Donation[]>([]);
  protected readonly selectedTab = signal<string>('current');

  private static readonly NEW_WINDOW_MS = 24 * 60 * 60 * 1000;

  protected isNewDonation(donatedAt: string): boolean {
    const timestamp = Date.parse(donatedAt);
    if (Number.isNaN(timestamp)) return false;
    const diff = Date.now() - timestamp;
    return diff >= 0 && diff <= DonationsPageComponent.NEW_WINDOW_MS;
  }

  protected formatTime(isoString: string): string {
    const d = new Date(isoString);
    const day = d.getDate();
    const months = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    const month = months[d.getMonth()];
    const year = d.getFullYear() + 543;
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    // Using '-' separator per AGENTS.md font compatibility rule
    return `${day} ${month} ${year} - ${hh}:${mm}`;
  }

  protected readonly groupedDonations = computed(() => {
    const list = this.donations().filter(d => d.amount > 0);
    if (list.length === 0) return [];

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const currentGroup: MonthGroup = {
      key: 'current',
      label: 'เดือนนี้',
      totalAmount: 0,
      donations: []
    };

    const otherGroup: MonthGroup = {
      key: 'other',
      label: 'เดือนอื่นๆ',
      totalAmount: 0,
      donations: []
    };

    for (const d of list) {
      const date = new Date(d.donatedAt);
      const isCurrentMonth = date.getFullYear() === currentYear && date.getMonth() === currentMonth;
      if (isCurrentMonth) {
        currentGroup.donations.push(d);
        currentGroup.totalAmount += d.amount;
      } else {
        otherGroup.donations.push(d);
        otherGroup.totalAmount += d.amount;
      }
    }

    const result: MonthGroup[] = [currentGroup];
    if (otherGroup.donations.length > 0) {
      result.push(otherGroup);
    }
    return result;
  });

  protected readonly currentGroup = computed(() => {
    const groups = this.groupedDonations();
    if (groups.length === 0) return null;
    return groups.find(g => g.key === this.selectedTab()) ?? groups[0];
  });

  ngOnInit(): void {
    this.titleService.setTitle('รายการสนับสนุน - ROM Collector');
    void this.loadDonations();
  }

  private async loadDonations(): Promise<void> {
    try {
      this.loading.set(true);
      const items = await this.donationRepo.getAllDonations();
      this.donations.set(items);
      
      if (items.length > 0) {
        const groups = this.groupedDonations();
        if (groups.length > 0 && !groups.some(g => g.key === this.selectedTab())) {
          this.selectedTab.set(groups[0].key);
        }
      }
    } catch (error: any) {
      this.statusMessage.show(error.message || 'ไม่สามารถโหลดข้อมูลการสนับสนุนได้', 'error');
    } finally {
      this.loading.set(false);
    }
  }
}
