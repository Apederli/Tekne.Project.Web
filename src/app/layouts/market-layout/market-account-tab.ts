import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideUser } from '@ng-icons/lucide';
import { HlmButton } from '@ui/button';
import { HlmSheetImports } from '@ui/sheet';
import { AuthStore } from '../../core/auth/auth-store';
import { ROUTE_MARKET } from '../../core/routes.const';
import { AuthModalService } from '../../features/market/auth-modal/auth-modal.service';
import { UserService } from '@services';

/**
 * Mobil alt çubuğun hesap sekmesi: misafirde "Giriş yap" (modal açar),
 * girişlide "Hesabım" — alttan sheet ile masaüstü popover'daki öğelerin
 * aynısı. ngSkipHydration gerekçesi `MarketUserMenu` ile aynı.
 */
@Component({
  selector: 'app-market-account-tab',
  imports: [RouterLink, NgIcon, HlmButton, HlmSheetImports],
  providers: [provideIcons({ lucideUser })],
  host: { ngSkipHydration: '', class: 'block' },
  template: `
    @if (authStore.isAuthenticated()) {
      <hlm-sheet #accountSheet="hlmSheet">
        <button
          hlmSheetTrigger
          side="bottom"
          class="flex w-full flex-col items-center gap-1 py-2 text-slate-500"
        >
          <ng-icon name="lucideUser" size="22" />
          <span class="text-[11px]">Hesabım</span>
        </button>
        <hlm-sheet-content *hlmSheetPortal class="pb-[env(safe-area-inset-bottom)]">
          <div hlmSheetHeader>
            <h2 hlmSheetTitle>{{ displayName() }}</h2>
            @if (authStore.user(); as user) {
              <p class="text-sm text-muted-foreground">{{ user.email }}</p>
            }
          </div>
          <div class="flex flex-col gap-1 p-4 pt-0">
            <a
              hlmBtn
              variant="ghost"
              class="h-10 justify-start"
              [routerLink]="['/', route.myReservations]"
              (click)="accountSheet.close()"
            >
              Rezervasyonlarım
            </a>
            <button
              hlmBtn
              variant="ghost"
              class="h-10 justify-start"
              (click)="accountSheet.close(); signOut()"
            >
              Çıkış yap
            </button>
          </div>
        </hlm-sheet-content>
      </hlm-sheet>
    } @else {
      <button
        type="button"
        class="flex w-full flex-col items-center gap-1 py-2 text-slate-500"
        (click)="authModal.open('login')"
      >
        <ng-icon name="lucideUser" size="22" />
        <span class="text-[11px]">Giriş yap</span>
      </button>
    }
  `,
})
export class MarketAccountTab {
  authStore = inject(AuthStore);
  userService = inject(UserService);
  authModal = inject(AuthModalService);

  route = ROUTE_MARKET;

  displayName = computed(() => {
    const user = this.authStore.user();
    return user ? `${user.name} ${user.surname}` : 'Hesap';
  });

  /** Gerekçe `MarketUserMenu.signOut` ile aynı — hatada da oturum düşer. */
  signOut(): void {
    this.userService.logout().subscribe({
      next: () => this.authStore.setUser(null),
      error: () => this.authStore.setUser(null),
    });
  }
}
