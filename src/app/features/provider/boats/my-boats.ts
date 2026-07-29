import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ROUTE_PARTNER } from '../../../core/routes.const';

@Component({
  selector: 'app-my-boats',
  imports: [RouterLink],
  template: `
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Teknelerim</h1>
      <a
        [routerLink]="newBoatUrl"
        class="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
      >
        Yeni tekne ekle
      </a>
    </div>
    <p class="mt-3 text-slate-600">İlan listesi burada yer alacak.</p>
  `,
})
export class MyBoats {
  newBoatUrl = ['/', ROUTE_PARTNER.main, ROUTE_PARTNER.dashboard, ROUTE_PARTNER.boats, ROUTE_PARTNER.boatNew];
}
