import { RenderMode, ServerRoute } from '@angular/ssr';
import { ROUTE_ADMIN, ROUTE_MARKET, ROUTE_PARTNER } from './core/routes.const';

/**
 * Render modu route bazında seçiliyor:
 * - Market'in halka açık sayfaları SSR/SSG (SEO ve ilk yükleme hızı için)
 * - Oturum gerektiren her şey ve admin/partner panelleri saf CSR
 */
export const serverRoutes: ServerRoute[] = [
  // --- Paneller: sunucuda hiç render edilmiyor ---
  { path: ROUTE_ADMIN.main, renderMode: RenderMode.Client },
  { path: `${ROUTE_ADMIN.main}/**`, renderMode: RenderMode.Client },
  { path: ROUTE_PARTNER.main, renderMode: RenderMode.Client },
  { path: `${ROUTE_PARTNER.main}/**`, renderMode: RenderMode.Client },

  // --- Market: oturuma bağlı sayfalar ---
  // Giriş/kayıt route'u yok — modal üzerinden yapılıyor.
  { path: ROUTE_MARKET.myReservations, renderMode: RenderMode.Client },
  { path: `${ROUTE_MARKET.booking}/:boatId`, renderMode: RenderMode.Client },
  { path: `${ROUTE_MARKET.payment}/:reservationId`, renderMode: RenderMode.Client },

  // --- Market: halka açık, SEO kritik ---
  { path: ROUTE_MARKET.main, renderMode: RenderMode.Prerender },
  { path: ROUTE_MARKET.boats, renderMode: RenderMode.Server },
  { path: `${ROUTE_MARKET.boatDetail}/:slug`, renderMode: RenderMode.Server },

  { path: '**', renderMode: RenderMode.Server },
];
