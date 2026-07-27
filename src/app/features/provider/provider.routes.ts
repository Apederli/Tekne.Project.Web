import { Routes } from '@angular/router';
import { ProviderLayout } from '../../layouts/provider-layout/provider-layout';

export const providerRoutes: Routes = [
  {
    path: '',
    component: ProviderLayout,
    children: [
      {
        path: '',
        loadComponent: () => import('./dashboard/dashboard').then((m) => m.ProviderDashboard),
      },
      {
        path: 'teknelerim',
        loadComponent: () => import('./boats/my-boats').then((m) => m.MyBoats),
      },
      {
        path: 'musaitlik',
        loadComponent: () => import('./availability/availability').then((m) => m.Availability),
      },
      {
        path: 'rezervasyonlar',
        loadComponent: () =>
          import('./reservations/provider-reservations').then((m) => m.ProviderReservations),
      },
    ],
  },
];
