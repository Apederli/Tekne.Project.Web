import { Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCalendarDays,
  lucideClipboardList,
  lucideLayoutDashboard,
  lucideShip,
  lucideUserCog,
  lucideUsers,
} from '@ng-icons/lucide';
import { HlmButton } from '@ui/button';
import { HlmPopoverImports } from '@ui/popover';
import { HlmSidebarImports } from '@ui/sidebar';
import { UserService } from '@services';
import { AuthStore } from '../../core/auth/auth-store';
import { NavItem } from './nav-item';

/**
 * Panel alanlarının (provider, admin) ortak iskeleti: spartan sidebar +
 * topbar + kullanıcı menüsü. Routed içerik ng-content ile projekte edilir,
 * router-outlet kullanan layout'ta kalır.
 *
 * Mobil drawer, daraltma ve tercihin cookie'de saklanması `hlm-sidebar`'ın
 * kendi işi — bu bileşende responsive dallanma yok.
 *
 * İkonlar burada kayıtlı, `NavItem` yalnızca adı taşıyor: iki alanın da
 * ikon kümesi küçük ve bu bileşen zaten ikisinin ortak iskeleti.
 */
@Component({
  selector: 'app-dashboard-shell',
  imports: [RouterLink, RouterLinkActive, NgIcon, HlmButton, HlmPopoverImports, HlmSidebarImports],
  providers: [
    provideIcons({
      lucideCalendarDays,
      lucideClipboardList,
      lucideLayoutDashboard,
      lucideShip,
      lucideUserCog,
      lucideUsers,
    }),
  ],
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
