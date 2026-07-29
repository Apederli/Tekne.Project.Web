/**
 * Local ortam — geliştiricinin kendi makinesi.
 *
 * `ng serve` (yani `npm start`) varsayılan olarak bunu kullanır.
 */
export const environment = {
  production: false,

  /**
   * API mutlak adresle veriliyor: uygulama 4200'de, API 5188'de koşuyor.
   * Backend'in CORS politikası `http://localhost:4200` origin'ine ve
   * `AllowCredentials`'a zaten açık.
   */
  apiBaseUrl: 'http://localhost:5188/api',

  /** Görsel kökü — lokalde de aynı R2 bucket'ı kullanıyoruz, kopyası yok. */
  cdnBaseUrl: 'https://pub-bb40570c5053405caedb5b68bd78ca83.r2.dev',
};
