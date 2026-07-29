import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmButton } from '@ui/button';
import { ROUTE_PARTNER } from '../../../core/routes.const';

@Component({
  selector: 'app-my-boats',
  imports: [RouterLink, HlmButton],
  template: `
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Teknelerim</h1>
      <a hlmBtn [routerLink]="newBoatUrl">Yeni tekne ekle</a>
    </div>
    <p class="mt-3 text-muted-foreground">İlan listesi burada yer alacak.</p>
  `,
})
export class MyBoats {
  newBoatUrl = ['/', ROUTE_PARTNER.main, ROUTE_PARTNER.dashboard, ROUTE_PARTNER.boats, ROUTE_PARTNER.boatNew];
}
