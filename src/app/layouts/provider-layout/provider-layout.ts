import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ROUTE_PARTNER } from '../../core/routes.const';

const ROOT = `/${ROUTE_PARTNER.main}`;

@Component({
  selector: 'app-provider-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './provider-layout.html',
})
export class ProviderLayout {
  navItems = [
    { path: ROOT, label: 'Genel Bakış', exact: true },
    { path: `${ROOT}/${ROUTE_PARTNER.boats}`, label: 'Teknelerim', exact: false },
    { path: `${ROOT}/${ROUTE_PARTNER.availability}`, label: 'Müsaitlik & Fiyat', exact: false },
    { path: `${ROOT}/${ROUTE_PARTNER.reservations}`, label: 'Rezervasyonlar', exact: false },
  ];
}
