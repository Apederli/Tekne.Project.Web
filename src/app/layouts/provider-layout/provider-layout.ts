import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-provider-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './provider-layout.html',
})
export class ProviderLayout {
  protected readonly navItems = [
    { path: '/provider', label: 'Genel Bakış', exact: true },
    { path: '/provider/teknelerim', label: 'Teknelerim', exact: false },
    { path: '/provider/musaitlik', label: 'Müsaitlik & Fiyat', exact: false },
    { path: '/provider/rezervasyonlar', label: 'Rezervasyonlar', exact: false },
  ];
}
