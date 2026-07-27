import { Routes } from '@angular/router';
import { AdminLayout } from '../../layouts/admin-layout/admin-layout';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayout,
    children: [
      {
        path: '',
        loadComponent: () => import('./dashboard/dashboard').then((m) => m.AdminDashboard),
      },
      {
        path: 'musteriler',
        loadComponent: () => import('./customers/customers').then((m) => m.Customers),
      },
      {
        path: 'tekne-sahipleri',
        loadComponent: () => import('./providers/providers').then((m) => m.Providers),
      },
      {
        path: 'tekneler',
        loadComponent: () => import('./boats/admin-boats').then((m) => m.AdminBoats),
      },
      {
        path: 'rezervasyonlar',
        loadComponent: () =>
          import('./reservations/admin-reservations').then((m) => m.AdminReservations),
      },
    ],
  },
];
