/**
 * URL segmentlerinin tek kaynağı.
 *
 * Bu sabitler üç yerde birden kullanılır — `*.routes.ts` tanımları, layout
 * `routerLink`'leri ve `app.routes.server.ts` render modu girdileri. Üçünün
 * elle senkron tutulması, `provider` → `partner` değişiminde olduğu gibi
 * kolayca gözden kaçıyor.
 *
 * `main` alanın kök segmenti, `''` ise o alanın index route'udur.
 */

export const ROUTE_MARKET = {
  main: '',
  boats: 'tekneler',
  boatDetail: 'tekne',
  booking: 'rezervasyon',
  payment: 'odeme',
  myReservations: 'rezervasyonlarim',
} as const;

export const ROUTE_ADMIN = {
  main: 'admin',
  dashboard: '',
  customers: 'musteriler',
  partners: 'tekne-sahipleri',
  boats: 'tekneler',
  reservations: 'rezervasyonlar',
} as const;

/**
 * Tekne sahibi paneli. URL'de `partner` görünür (backend terminolojisi),
 * kod tarafında alan hâlâ `provider` olarak adlandırılmış durumda.
 *
 * `dashboard` panelin taban segmentidir: tüm panel sayfaları
 * `/partner/dashboard` altında yaşar, `login` guard dışında kalır.
 */
export const ROUTE_PARTNER = {
  main: 'partner',
  login: 'login',
  dashboard: 'dashboard',
  boats: 'teknelerim',
  /** `boats` altına eklenir: `/partner/dashboard/teknelerim/yeni`. */
  boatNew: 'yeni',
  /** `boats/:boatId` altına eklenir: `/partner/dashboard/teknelerim/5/fotograflar`. */
  boatPhotos: 'fotograflar',
  availability: 'musaitlik',
  reservations: 'rezervasyonlar',
} as const;
