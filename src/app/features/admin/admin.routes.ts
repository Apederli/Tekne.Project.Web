import { Routes } from '@angular/router';
import { AdminLayout } from '../../layouts/admin-layout/admin-layout';
import { ROUTE_ADMIN } from '../../core/routes.const';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayout,
    children: [
      {
        path: ROUTE_ADMIN.dashboard,
        loadComponent: () => import('./dashboard/dashboard').then((m) => m.AdminDashboard),
      },
      {
        path: ROUTE_ADMIN.customers,
        loadComponent: () => import('./customers/customers').then((m) => m.Customers),
      },
      {
        path: ROUTE_ADMIN.partners,
        loadComponent: () => import('./providers/providers').then((m) => m.Providers),
      },
      {
        path: ROUTE_ADMIN.boats,
        loadComponent: () => import('./boats/admin-boats').then((m) => m.AdminBoats),
      },
      {
        path: ROUTE_ADMIN.reservations,
        loadComponent: () =>
          import('./reservations/admin-reservations').then((m) => m.AdminReservations),
      },
    ],
  },
];
