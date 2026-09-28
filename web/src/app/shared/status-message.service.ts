import { Injectable, signal } from '@angular/core';

export type StatusMessageTone = 'info' | 'success' | 'error';

export interface StatusMessage {
  text: string;
  tone: StatusMessageTone;
}

export interface StatusMessageOptions {
  autoDismiss?: boolean;
}

@Injectable({ providedIn: 'root' })
export class StatusMessageService {
  private static readonly autoDismissMs = 5000;
  private readonly currentMessage = signal<StatusMessage | null>(null);
  private dismissTimer: ReturnType<typeof setTimeout> | null = null;

  readonly message = this.currentMessage.asReadonly();

  show(
    text: string,
    tone: StatusMessageTone = 'info',
    autoDismissOrOptions: boolean | StatusMessageOptions = true
  ): void {
    const autoDismiss = typeof autoDismissOrOptions === 'boolean'
      ? autoDismissOrOptions
      : (autoDismissOrOptions.autoDismiss ?? true);

    this.clearDismissTimer();
    this.currentMessage.set({ text, tone });
    if (autoDismiss) {
      this.dismissTimer = setTimeout(() => {
        this.currentMessage.set(null);
        this.dismissTimer = null;
      }, StatusMessageService.autoDismissMs);
    }
  }

  clear(): void {
    this.clearDismissTimer();
    this.currentMessage.set(null);
  }

  private clearDismissTimer(): void {
    if (this.dismissTimer === null) return;
    clearTimeout(this.dismissTimer);
    this.dismissTimer = null;
  }
}
