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
};
