import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ROUTE_PARTNER } from '../../core/routes.const';
import { DashboardShell } from '../dashboard-shell/dashboard-shell';
import { NavItem } from '../dashboard-shell/nav-item';

const ROOT = `/${ROUTE_PARTNER.main}`;

@Component({
  selector: 'app-provider-layout',
  imports: [RouterOutlet, DashboardShell],
  templateUrl: './provider-layout.html',
})
export class ProviderLayout {
  loginPath = `${ROOT}/${ROUTE_PARTNER.login}`;
  navItems: NavItem[] = [
    { path: ROOT, label: 'Genel Bakış', exact: true },
    { path: `${ROOT}/${ROUTE_PARTNER.boats}`, label: 'Teknelerim', exact: false },
    { path: `${ROOT}/${ROUTE_PARTNER.availability}`, label: 'Müsaitlik & Fiyat', exact: false },
    { path: `${ROOT}/${ROUTE_PARTNER.reservations}`, label: 'Rezervasyonlar', exact: false },
  ];
}
