import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-logout-page',
  standalone: true,
  templateUrl: './logout-page.component.html',
  styleUrl: './logout-page.component.css'
})
export class LogoutPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  constructor() {
    void this.logout();
  }

  private async logout(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl('/', { replaceUrl: true });
  }
}
