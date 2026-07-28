import { Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { HlmButton } from '@ui/button';
import { HlmPopoverImports } from '@ui/popover';
import { UserService } from '@services/user.service';
import { AuthStore } from '../../core/auth/auth-store';
import { NavItem } from './nav-item';

/**
 * Panel alanlarının (provider, ileride admin) ortak iskeleti:
 * sidebar + topbar + kullanıcı menüsü. Routed içerik ng-content ile
 * projekte edilir, router-outlet kullanan layout'ta kalır.
 */
@Component({
  selector: 'app-dashboard-shell',
  imports: [RouterLink, RouterLinkActive, HlmButton, HlmPopoverImports],
  templateUrl: './dashboard-shell.html',
})
export class DashboardShell {
  panelTitle = input.required<string>();
  navItems = input.required<NavItem[]>();
  /** Çıkış sonrası yönlendirilecek adres (ör. `/partner/login`). */
  loginPath = input.required<string>();

  authStore = inject(AuthStore);
  userService = inject(UserService);
  router = inject(Router);

  /** Sayfa yenilenince store boşalır; o durumda nötr "Hesap" gösterilir. */
  displayName = computed(() => {
    const user = this.authStore.user();
    return user ? `${user.name} ${user.surname}` : 'Hesap';
  });

  /**
   * Çıkış: istek başarısız olsa bile lokal oturum düşürülür — cookie
   * silinememiş olabilir ama istemci tarafında oturum bitmiştir.
   */
  signOut(): void {
    this.userService.logout().subscribe({
      next: () => this.completeSignOut(),
      error: () => this.completeSignOut(),
    });
  }

  completeSignOut(): void {
    this.authStore.setUser(null);
    void this.router.navigateByUrl(this.loginPath());
  }
}
