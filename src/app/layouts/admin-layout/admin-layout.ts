import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.html',
})
export class AdminLayout {
  protected readonly navItems = [
    { path: '/admin', label: 'Genel Bakış', exact: true },
    { path: '/admin/musteriler', label: 'Müşteriler', exact: false },
    { path: '/admin/tekne-sahipleri', label: 'Tekne Sahipleri', exact: false },
    { path: '/admin/tekneler', label: 'Tekneler', exact: false },
    { path: '/admin/rezervasyonlar', label: 'Rezervasyonlar', exact: false },
  ];
}
