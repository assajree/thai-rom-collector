import { Injectable, inject, signal } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, user } from '@angular/fire/auth';
import { Database, get, ref, query, orderByChild, equalTo, limitToFirst } from '@angular/fire/database';
import { Subscription, from } from 'rxjs';
import type { User } from 'firebase/auth';
import { AdminProfile } from '../models/patch.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly database = inject(Database);
  private readonly currentUser = signal<User | null>(null);
  private readonly adminState = signal(false);
  private readonly adminCheckComplete = signal(false);
  private readonly vipCheckComplete = signal(false);
  private readonly authSubscription: Subscription;
  private adminSubscription?: Subscription;
  private vipSubscription?: Subscription;

  readonly user = this.currentUser.asReadonly();
  readonly isAdmin = this.adminState.asReadonly();
  readonly isVip = signal(false);

  constructor() {
    this.authSubscription = user(this.auth).subscribe((currentUser) => {
      this.currentUser.set(currentUser);
      this.adminSubscription?.unsubscribe();
      this.vipSubscription?.unsubscribe();
      this.adminState.set(false);
      this.isVip.set(false);
      this.adminCheckComplete.set(!currentUser);
      this.vipCheckComplete.set(!currentUser);
      if (!currentUser) return;
      this.adminSubscription = from(get(ref(this.database, `admins/${currentUser.uid}`))).subscribe({
        next: (profile) => {
          this.adminState.set(profile.exists());
          this.adminCheckComplete.set(true);
        },
        error: () => {
          this.adminState.set(false);
          this.adminCheckComplete.set(true);
        }
      });
      
      const vipQuery = query(ref(this.database, 'redeemCodes'), orderByChild('redeemedBy'), equalTo(currentUser.uid), limitToFirst(1));
      this.vipSubscription = from(get(vipQuery)).subscribe({
        next: (snapshot) => {
          this.isVip.set(snapshot.exists());
          this.vipCheckComplete.set(true);
        },
        error: () => {
          this.isVip.set(false);
          this.vipCheckComplete.set(true);
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

  async waitForVipCheck(timeoutMs = 5000): Promise<boolean> {
    if (this.vipCheckComplete()) return this.isVip();
    return new Promise((resolve) => {
      const started = Date.now();
      const poll = (): void => {
        if (this.vipCheckComplete() || Date.now() - started >= timeoutMs) {
          resolve(this.isVip());
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
