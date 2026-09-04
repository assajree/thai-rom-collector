import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css'
})
export class ConfirmDialogComponent {
  @Input() title = 'ยืนยันการทำรายการ';
  @Input() message = 'คุณต้องการดำเนินการต่อหรือไม่?';
  @Input() confirmLabel = 'ยืนยัน';
  @Input() danger = false;
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  protected onEscape(): void { this.cancelled.emit(); }
}
