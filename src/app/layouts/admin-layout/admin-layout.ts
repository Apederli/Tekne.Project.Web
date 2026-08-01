import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ROUTE_ADMIN } from '../../core/routes.const';
import { DashboardShell } from '../dashboard-shell/dashboard-shell';
import { NavItem } from '../dashboard-shell/nav-item';

const ROOT = `/${ROUTE_ADMIN.main}`;

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, DashboardShell],
  templateUrl: './admin-layout.html',
})
export class AdminLayout {
  /**
   * Admin'in ayrı login sayfası yok — `roleGuard('admin')` da başarısızlıkta
   * varsayılan `['/']`'e düşürüyor; çıkış aynı yere gitsin.
   */
  loginPath = '/';
  navItems: NavItem[] = [
    { path: ROOT, label: 'Genel Bakış', exact: true, icon: 'lucideLayoutDashboard' },
    {
      path: `${ROOT}/${ROUTE_ADMIN.customers}`,
      label: 'Müşteriler',
      exact: false,
      icon: 'lucideUsers',
    },
    {
      path: `${ROOT}/${ROUTE_ADMIN.partners}`,
      label: 'Tekne Sahipleri',
      shortLabel: 'Sahipler',
      exact: false,
      icon: 'lucideUserCog',
    },
    {
      path: `${ROOT}/${ROUTE_ADMIN.boats}`,
      label: 'Tekneler',
      exact: false,
      icon: 'lucideShip',
    },
    {
      path: `${ROOT}/${ROUTE_ADMIN.reservations}`,
      label: 'Rezervasyonlar',
      exact: false,
      icon: 'lucideClipboardList',
    },
  ];
}
