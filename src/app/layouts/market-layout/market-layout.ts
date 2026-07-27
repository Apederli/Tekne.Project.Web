import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-market-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './market-layout.html',
})
export class MarketLayout {}
