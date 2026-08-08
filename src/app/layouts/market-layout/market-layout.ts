import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCompass,
  lucideEllipsis,
  lucideHeart,
  lucideInbox,
  lucideSearch,
} from '@ng-icons/lucide';
import { ROUTE_MARKET } from '../../core/routes.const';
import { MarketAccountTab } from './market-account-tab';
import { MarketUserMenu } from './market-user-menu';

@Component({
  selector: 'app-market-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIcon, MarketAccountTab, MarketUserMenu],
  providers: [
    provideIcons({
      lucideCompass,
      lucideEllipsis,
      lucideHeart,
      lucideInbox,
      lucideSearch,
    }),
  ],
  templateUrl: './market-layout.html',
})
export class MarketLayout {
  route = ROUTE_MARKET;
}
