import { Injectable, inject, signal } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, user } from '@angular/fire/auth';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { Subscription } from 'rxjs';
import type { User } from 'firebase/auth';
import { AdminProfile } from '../models/patch.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly firestore = inject(Firestore);
  private readonly currentUser = signal<User | null>(null);
  private readonly adminState = signal(false);
  private readonly adminCheckComplete = signal(false);
  private readonly authSubscription: Subscription;
  private adminSubscription?: Subscription;

  readonly user = this.currentUser.asReadonly();
  readonly isAdmin = this.adminState.asReadonly();

  constructor() {
    this.authSubscription = user(this.auth).subscribe((currentUser) => {
      this.currentUser.set(currentUser);
      this.adminSubscription?.unsubscribe();
      this.adminState.set(false);
      this.adminCheckComplete.set(!currentUser);
      if (!currentUser) return;
      this.adminSubscription = docData(doc(this.firestore, `admins/${currentUser.uid}`)).subscribe({
        next: (profile) => {
          this.adminState.set(Boolean(profile));
          this.adminCheckComplete.set(true);
        },
        error: () => {
          this.adminState.set(false);
          this.adminCheckComplete.set(true);
        }
      });
    });
  }

  async waitForAdminCheck(timeoutMs = 5000): Promise<boolean> {
    if (this.adminCheckComplete()) return this.adminState();
    return new Promise((resolve) => {
      const started = Date.now();
      const poll = (): void => {
        if (this.adminCheckComplete() || Date.now() - started >= timeoutMs) {
          resolve(this.adminState());
          return;
        }
        window.setTimeout(poll, 50);
      };
      poll();
    });
  }

  async signInWithGoogle(): Promise<void> {
    await signInWithPopup(this.auth, new GoogleAuthProvider());
  }

  async signOut(): Promise<void> {
    await firebaseSignOut(this.auth);
  }

  /** Allows callers to display a safe profile without exposing Firestore data. */
  getAdminProfile(): AdminProfile | null {
    const currentUser = this.currentUser();
    return currentUser && this.adminState() ? { uid: currentUser.uid, email: currentUser.email ?? '' } : null;
  }
}
