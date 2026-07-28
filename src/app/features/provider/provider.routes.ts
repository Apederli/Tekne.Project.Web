import { Routes } from '@angular/router';
import { ProviderLayout } from '../../layouts/provider-layout/provider-layout';
import { roleGuard } from '../../core/auth/role.guard';
import { ROUTE_PARTNER } from '../../core/routes.const';

const LOGIN_URL = ['/', ROUTE_PARTNER.main, ROUTE_PARTNER.login];

export const providerRoutes: Routes = [
  /** Giriş sayfası guard'ın DIŞINDA — aksi hâlde giriş yapmamış kullanıcı buraya ulaşamaz. */
  {
    path: ROUTE_PARTNER.login,
    loadComponent: () => import('./login/partner-login').then((m) => m.PartnerLogin),
  },
  {
    path: ROUTE_PARTNER.dashboard,
    component: ProviderLayout,
    canMatch: [roleGuard('provider', LOGIN_URL)],
    children: [
      {
        path: '',
        loadComponent: () => import('./dashboard/dashboard').then((m) => m.ProviderDashboard),
      },
      {
        path: ROUTE_PARTNER.boats,
        loadComponent: () => import('./boats/my-boats').then((m) => m.MyBoats),
      },
      {
        path: ROUTE_PARTNER.availability,
        loadComponent: () => import('./availability/availability').then((m) => m.Availability),
      },
      {
        path: ROUTE_PARTNER.reservations,
        loadComponent: () =>
          import('./reservations/provider-reservations').then((m) => m.ProviderReservations),
      },
    ],
  },
  /** Çıplak /partner → panel tabanı. Oturum yoksa dashboard guard'ı login'e atar. */
  { path: '', pathMatch: 'full', redirectTo: ROUTE_PARTNER.dashboard },
];
