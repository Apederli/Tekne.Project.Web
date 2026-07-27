import { Routes } from '@angular/router';
import { MarketLayout } from '../../layouts/market-layout/market-layout';

export const marketRoutes: Routes = [
  {
    path: '',
    component: MarketLayout,
    children: [
      {
        path: '',
        loadComponent: () => import('./home/home').then((m) => m.Home),
      },
      {
        path: 'tekneler',
        loadComponent: () => import('./boat-search/boat-search').then((m) => m.BoatSearch),
      },
      {
        path: 'tekne/:slug',
        loadComponent: () => import('./boat-detail/boat-detail').then((m) => m.BoatDetail),
      },
      {
        path: 'rezervasyon/:boatId',
        loadComponent: () => import('./booking/booking').then((m) => m.Booking),
      },
      {
        path: 'odeme/:reservationId',
        loadComponent: () => import('./payment/payment').then((m) => m.Payment),
      },
      {
        path: 'giris',
        loadComponent: () => import('./account/login/login').then((m) => m.Login),
      },
      {
        path: 'kayit',
        loadComponent: () => import('./account/register/register').then((m) => m.Register),
      },
      {
        path: 'rezervasyonlarim',
        loadComponent: () =>
          import('./account/my-reservations/my-reservations').then((m) => m.MyReservations),
      },
    ],
  },
];
