import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCompass, lucideEllipsis, lucideHeart, lucideInbox } from '@ng-icons/lucide';
import { ROUTE_MARKET } from '../../core/routes.const';
import { SearchTrigger } from '../../features/market/search/search-trigger';
import { MarketAccountTab } from './market-account-tab';
import { MarketUserMenu } from './market-user-menu';

@Component({
  selector: 'app-market-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NgIcon,
    MarketAccountTab,
    MarketUserMenu,
    SearchTrigger,
  ],
  providers: [
    provideIcons({
      lucideCompass,
      lucideEllipsis,
      lucideHeart,
      lucideInbox,
    }),
  ],
  templateUrl: './market-layout.html',
})
export class MarketLayout {
  router = inject(Router);

  route = ROUTE_MARKET;

  url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  /**
   * Anasayfada başlık hero'nun üstünde saydam duruyor; görsel navbar'ın
   * arkasından da geçsin diye. Diğer sayfalarda beyaz ve akışta.
   */
  overlayHeader = computed(() => this.url().split('?')[0] === '/');
}
