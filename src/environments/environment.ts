/**
 * Production ortamı — varsayılan dosya.
 *
 * Diğer iki ortam `angular.json` içindeki `fileReplacements` ile bu dosyanın
 * yerine geçer (`local` → `environment.local.ts`, `dev` → `environment.dev.ts`);
 * başka bir yerde seçim yapılmaz.
 */
export const environment = {
  production: true,

  /**
   * API kökü.
   *
   * Göreli bırakıldı: yayında SSR sunucusu ile API'nin aynı origin arkasında
   * (reverse proxy) durduğu varsayılıyor — cookie'nin sorunsuz gitmesi için de
   * en temizi bu. API ayrı bir alan adına taşınırsa buraya mutlak adres yazılmalı
   * ve backend'in `Cors:Origins` listesi güncellenmeli.
   */
  apiBaseUrl: '/api',

  /**
   * Görsellerin servis edildiği R2 bucket kökü. `BoatPhotoOutputModel.objectKey`
   * bunun peşine eklenir (`boat-image/` prefix'i key'in kendi içinde).
   *
   * TODO: burada duran adres Cloudflare'in `r2.dev` geliştirme URL'i — rate-limit'li
   * ve production için önerilmiyor. Yayına çıkmadan bucket kendi alan adımıza
   * bağlanmalı (`cdn.teknevia.com` gibi); resize/`srcset` desteği de ancak o zaman
   * açılıyor.
   */
  cdnBaseUrl: 'https://pub-bb40570c5053405caedb5b68bd78ca83.r2.dev',
};
