import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCompass,
  lucideEllipsis,
  lucideHeart,
  lucideInbox,
  lucideSearch,
  lucideUser,
} from '@ng-icons/lucide';
import { ROUTE_MARKET } from '../../core/routes.const';

@Component({
  selector: 'app-market-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIcon],
  providers: [
    provideIcons({
      lucideCompass,
      lucideEllipsis,
      lucideHeart,
      lucideInbox,
      lucideSearch,
      lucideUser,
    }),
  ],
  templateUrl: './market-layout.html',
})
export class MarketLayout {
  route = ROUTE_MARKET;
}
