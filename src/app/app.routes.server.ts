import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Render modu route bazında seçiliyor:
 * - Market'in halka açık sayfaları SSR/SSG (SEO ve ilk yükleme hızı için)
 * - Oturum gerektiren her şey ve admin/provider panelleri saf CSR
 */
export const serverRoutes: ServerRoute[] = [
  // --- Paneller: sunucuda hiç render edilmiyor ---
  { path: 'admin', renderMode: RenderMode.Client },
  { path: 'admin/**', renderMode: RenderMode.Client },
  { path: 'provider', renderMode: RenderMode.Client },
  { path: 'provider/**', renderMode: RenderMode.Client },

  // --- Market: oturuma bağlı sayfalar ---
  { path: 'giris', renderMode: RenderMode.Client },
  { path: 'kayit', renderMode: RenderMode.Client },
  { path: 'rezervasyonlarim', renderMode: RenderMode.Client },
  { path: 'rezervasyon/:boatId', renderMode: RenderMode.Client },
  { path: 'odeme/:reservationId', renderMode: RenderMode.Client },

  // --- Market: halka açık, SEO kritik ---
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'tekneler', renderMode: RenderMode.Server },
  { path: 'tekne/:slug', renderMode: RenderMode.Server },

  { path: '**', renderMode: RenderMode.Server },
];
