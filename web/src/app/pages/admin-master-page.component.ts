import { CommonModule } from '@angular/common';
import { Component, ContentChild, EventEmitter, Input, Output, TemplateRef } from '@angular/core';

export interface AdminMasterItem { id: string; [key: string]: any; }

@Component({ selector: 'app-admin-master-page', standalone: true, imports: [CommonModule], templateUrl: './admin-master-page.component.html', styleUrl: './admin-master-page.component.css' })
export class AdminMasterPageComponent {
  @Input() title = ''; @Input() description = ''; @Input() addLabel = 'เพิ่มข้อมูล'; @Input() emptyText = 'ยังไม่มีข้อมูล';
  @Input() items: AdminMasterItem[] = []; @Input() dialogOpen = false; @Input() dialogTitle = ''; @Input() saving = false;
  @Output() readonly create = new EventEmitter<void>(); @Output() readonly edit = new EventEmitter<any>(); @Output() readonly remove = new EventEmitter<any>();
  @Output() readonly save = new EventEmitter<void>(); @Output() readonly close = new EventEmitter<void>();
  @ContentChild('card') protected readonly cardTemplate?: TemplateRef<unknown>; @ContentChild('editor') protected readonly editorTemplate?: TemplateRef<unknown>;
}
