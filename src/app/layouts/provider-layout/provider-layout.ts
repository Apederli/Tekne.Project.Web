import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ROUTE_PARTNER } from '../../core/routes.const';
import { DashboardShell } from '../dashboard-shell/dashboard-shell';
import { NavItem } from '../dashboard-shell/nav-item';

const ROOT = `/${ROUTE_PARTNER.main}/${ROUTE_PARTNER.dashboard}`;

@Component({
  selector: 'app-provider-layout',
  imports: [RouterOutlet, DashboardShell],
  templateUrl: './provider-layout.html',
})
export class ProviderLayout {
  /** Login, dashboard tabanının DIŞINDA — ROOT'tan değil, alan kökünden kurulur. */
  loginPath = `/${ROUTE_PARTNER.main}/${ROUTE_PARTNER.login}`;
  navItems: NavItem[] = [
    { path: ROOT, label: 'Genel Bakış', exact: true, icon: 'lucideLayoutDashboard' },
    {
      path: `${ROOT}/${ROUTE_PARTNER.boats}`,
      label: 'Teknelerim',
      exact: false,
      icon: 'lucideShip',
    },
    {
      path: `${ROOT}/${ROUTE_PARTNER.availability}`,
      label: 'Müsaitlik & Fiyat',
      shortLabel: 'Müsaitlik',
      exact: false,
      icon: 'lucideCalendarDays',
    },
    {
      path: `${ROOT}/${ROUTE_PARTNER.reservations}`,
      label: 'Rezervasyonlar',
      exact: false,
      icon: 'lucideClipboardList',
    },
  ];
}
