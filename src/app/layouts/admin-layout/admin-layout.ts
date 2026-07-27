import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ROUTE_ADMIN } from '../../core/routes.const';

const ROOT = `/${ROUTE_ADMIN.main}`;

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.html',
})
export class AdminLayout {
  protected readonly navItems = [
    { path: ROOT, label: 'Genel Bakış', exact: true },
    { path: `${ROOT}/${ROUTE_ADMIN.customers}`, label: 'Müşteriler', exact: false },
    { path: `${ROOT}/${ROUTE_ADMIN.partners}`, label: 'Tekne Sahipleri', exact: false },
    { path: `${ROOT}/${ROUTE_ADMIN.boats}`, label: 'Tekneler', exact: false },
    { path: `${ROOT}/${ROUTE_ADMIN.reservations}`, label: 'Rezervasyonlar', exact: false },
  ];
}
