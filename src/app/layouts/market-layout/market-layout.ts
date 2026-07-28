import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ROUTE_MARKET } from '../../core/routes.const';

@Component({
  selector: 'app-market-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './market-layout.html',
})
export class MarketLayout {
  route = ROUTE_MARKET;
}
