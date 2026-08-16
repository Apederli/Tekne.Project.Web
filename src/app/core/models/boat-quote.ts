/**
 * Fiyat teklifi modelleri (`GET /api/Boats/{id}/quote`).
 *
 * Uç üç alanı da zorunlu ister: eksik parametreyle giden istek 422 döner.
 * Tutarlar teklif anında hesaplanır — istemci saat ücretini süreyle çarpıp
 * kendi toplamını üretmez.
 */

export interface BoatQuoteInputModel {
  /** `YYYY-MM-DD`. */
  date: string;
  startHour: number;
  hours: number;
}

export interface BoatQuoteOutputModel {
  /** Teklifin saat ücreti — tarife güne göre değişebildiği için yanıttan okunur. */
  rate: number;
  hours: number;
  total: number;
  /** Online alınan kapora; kalanı teknede ödenir. */
  prePayment: number;
}

/**
 * Detay sayfasındaki rezervasyon kartının form modeli. Değerler kontrol
 * tiplerinde tutulur: select string taşır, dokunulmamış sayı `null`'dır.
 */
export interface BoatBookingFormModel {
  harborId: string;
  date: Date | null;
  /** `''` | `'0'` … `'23'`. */
  startHour: string;
  hours: number | null;
  people: number | null;
}
