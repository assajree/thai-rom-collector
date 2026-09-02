import { Injectable, signal } from '@angular/core';

export type StatusMessageTone = 'info' | 'error';

export interface StatusMessage {
  text: string;
  tone: StatusMessageTone;
}

@Injectable({ providedIn: 'root' })
export class StatusMessageService {
  private readonly currentMessage = signal<StatusMessage | null>(null);

  readonly message = this.currentMessage.asReadonly();

  show(text: string, tone: StatusMessageTone = 'info'): void {
    this.currentMessage.set({ text, tone });
  }

  clear(): void {
    this.currentMessage.set(null);
  }
}
