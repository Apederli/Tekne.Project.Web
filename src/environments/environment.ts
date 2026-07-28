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
};
