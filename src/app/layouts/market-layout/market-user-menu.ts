import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideUser } from '@ng-icons/lucide';
import { HlmButton } from '@ui/button';
import { HlmPopoverImports } from '@ui/popover';
import { AuthStore } from '../../core/auth/auth-store';
import { ROUTE_MARKET } from '../../core/routes.const';
import { AuthModalService } from '../../features/market/auth-modal/auth-modal.service';
import { UserService } from '@services';

/**
 * Masaüstü header'ın sağ alanı: misafirde "Giriş / Kayıt Ol", girişlide
 * ikon + popover hesap menüsü (dashboard-shell kalıbı; navbar'da isim
 * yazmaz — kullanıcı kararı, 2026-08-04).
 *
 * ngSkipHydration: SSR'da store hep boş olduğundan sunucu misafir hâlini
 * basar; girişli istemcide fark NG0500 üretirdi. Bu parça hydrate
 * edilmez, istemcide güncel store'la yeniden çizilir.
 */
@Component({
  selector: 'app-market-user-menu',
  imports: [RouterLink, NgIcon, HlmButton, HlmPopoverImports],
  providers: [provideIcons({ lucideUser })],
  host: { ngSkipHydration: '' },
  template: `
    @if (authStore.isAuthenticated()) {
      <hlm-popover #accountMenu="brnPopover" align="end" sideOffset="8">
        <button
          hlmPopoverTrigger
          hlmBtn
          variant="outline"
          size="icon"
          class="rounded-full"
          aria-label="Hesap menüsü"
        >
          <ng-icon name="lucideUser" size="20" />
        </button>
        <hlm-popover-content *hlmPopoverPortal class="w-64">
          <div class="px-1.5 py-1">
            <p class="text-sm font-medium">{{ displayName() }}</p>
            @if (authStore.user(); as user) {
              <p class="text-sm text-muted-foreground">{{ user.email }}</p>
            }
          </div>
          <div class="border-t border-border"></div>
          <a
            hlmBtn
            variant="ghost"
            class="w-full justify-start"
            [routerLink]="['/', route.myReservations]"
            (click)="accountMenu.close()"
          >
            Rezervasyonlarım
          </a>
          <button
            hlmBtn
            variant="ghost"
            class="w-full justify-start"
            (click)="accountMenu.close(); signOut()"
          >
            Çıkış yap
          </button>
        </hlm-popover-content>
      </hlm-popover>
    } @else {
      <button
        type="button"
        class="text-sm text-slate-600 hover:text-slate-900"
        (click)="authModal.open('login')"
      >
        Giriş
      </button>
      <button
        type="button"
        class="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        (click)="authModal.open('register')"
      >
        Kayıt Ol
      </button>
    }
  `,
})
export class MarketUserMenu {
  authStore = inject(AuthStore);
  userService = inject(UserService);
  authModal = inject(AuthModalService);

  route = ROUTE_MARKET;

  displayName = computed(() => {
    const user = this.authStore.user();
    return user ? `${user.name} ${user.surname}` : 'Hesap';
  });

  /**
   * Çıkış: istek başarısız olsa bile lokal oturum düşürülür — cookie
   * silinememiş olabilir ama istemci tarafında oturum bitmiştir
   * (dashboard-shell kalıbı). Market'te guard'lı sayfa yok; yerinde kalınır.
   */
  signOut(): void {
    this.userService.logout().subscribe({
      next: () => this.authStore.setUser(null),
      error: () => this.authStore.setUser(null),
    });
  }
}
