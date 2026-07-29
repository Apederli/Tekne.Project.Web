import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMenu } from '@ng-icons/lucide';
import { HlmButton } from '@ui/button';
import { HlmPopoverImports } from '@ui/popover';
import { HlmSheetImports } from '@ui/sheet';
import { UserService } from '@services';
import { AuthStore } from '../../core/auth/auth-store';
import { NavItem } from './nav-item';

/**
 * Panel alanlarının (provider, ileride admin) ortak iskeleti:
 * sidebar + topbar + kullanıcı menüsü. Routed içerik ng-content ile
 * projekte edilir, router-outlet kullanan layout'ta kalır.
 *
 * lg altında sidebar gizlenir; nav, hamburger ile soldan açılan sheet
 * drawer'ında gösterilir. Nav markup'ı tek ng-template'te yaşar, iki
 * yerde (statik sidebar + drawer) outlet ile basılır.
 */
@Component({
  selector: 'app-dashboard-shell',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    RouterLinkActive,
    NgIcon,
    HlmButton,
    HlmPopoverImports,
    HlmSheetImports,
  ],
  providers: [provideIcons({ lucideMenu })],
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

  /** lg altındaki drawer'ın durumu; sheet'in state input'una bağlanır. */
  mobileNavState = signal<'open' | 'closed'>('closed');

  /** Sayfa yenilenince store boşalır; o durumda nötr "Hesap" gösterilir. */
  displayName = computed(() => {
    const user = this.authStore.user();
    return user ? `${user.name} ${user.surname}` : 'Hesap';
  });

  /**
   * Nav linki tıklanınca drawer kapatılır. Statik sidebar'daki linkler de
   * aynı template'i kullandığı için burayı çağırır — drawer zaten kapalıyken
   * no-op'tur.
   */
  closeMobileNav(): void {
    this.mobileNavState.set('closed');
  }

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
