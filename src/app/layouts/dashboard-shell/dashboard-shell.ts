import { Component, inject, input } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { HlmButton } from '@ui/button';
import { UserService } from '@services/user.service';
import { AuthStore } from '../../core/auth/auth-store';
import { NavItem } from './nav-item';

/**
 * Panel alanlarının (provider, ileride admin) ortak iskeleti:
 * sidebar + topbar. Routed içerik ng-content ile projekte edilir,
 * router-outlet kullanan layout'ta kalır.
 */
@Component({
  selector: 'app-dashboard-shell',
  imports: [RouterLink, RouterLinkActive, HlmButton],
  templateUrl: './dashboard-shell.html',
})
export class DashboardShell {
  title = input.required<string>();
  navItems = input.required<NavItem[]>();
  /** Çıkış sonrası yönlendirilecek adres (ör. `/partner/login`). */
  loginPath = input.required<string>();

  authStore = inject(AuthStore);
  userService = inject(UserService);
  router = inject(Router);
}
