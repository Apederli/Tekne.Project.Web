import { Routes } from '@angular/router';
import { MarketLayout } from '../../layouts/market-layout/market-layout';
import { ROUTE_MARKET } from '../../core/routes.const';

export const marketRoutes: Routes = [
  {
    path: '',
    component: MarketLayout,
    children: [
      {
        path: ROUTE_MARKET.main,
        loadComponent: () => import('./home/home').then((m) => m.Home),
      },
      {
        path: ROUTE_MARKET.boats,
        loadComponent: () => import('./boat-search/boat-search').then((m) => m.BoatSearch),
      },
      {
        path: `${ROUTE_MARKET.boatDetail}/:slug`,
        loadComponent: () => import('./boat-detail/boat-detail').then((m) => m.BoatDetail),
      },
      {
        path: `${ROUTE_MARKET.booking}/:boatId`,
        loadComponent: () => import('./booking/booking').then((m) => m.Booking),
      },
      {
        path: `${ROUTE_MARKET.payment}/:reservationId`,
        loadComponent: () => import('./payment/payment').then((m) => m.Payment),
      },
      {
        path: ROUTE_MARKET.myReservations,
        loadComponent: () =>
          import('./account/my-reservations/my-reservations').then((m) => m.MyReservations),
      },
    ],
  },
];
