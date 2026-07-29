/**
 * Dev ortamı — ortak test sunucusu.
 *
 * `ng build --configuration dev` / `ng serve --configuration dev` bunu kullanır.
 */
export const environment = {
  production: false,

  /**
   * TODO: dev sunucusunun API adresi girilmeli.
   *
   * Şimdilik göreli — SSR sunucusu ile API'nin aynı origin arkasında durduğu
   * varsayımı. API ayrı bir alan adındaysa mutlak adres yazılmalı ve backend'in
   * `Cors:Origins` listesine dev alan adı eklenmeli.
   */
  apiBaseUrl: '/api',

  /** Görsel kökü — dev de aynı R2 bucket'ı kullanıyor. */
  cdnBaseUrl: 'https://pub-bb40570c5053405caedb5b68bd78ca83.r2.dev',
};
