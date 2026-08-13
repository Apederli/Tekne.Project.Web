/**
 * `BoatsController`'ın fiyatlandırma uçlarının modelleri
 * (`GET/PUT /api/Boats/{id}/pricing`). Alanlar Swagger şemasıyla birebir.
 *
 * Matris: hafta içi/sonu × sabah/akşam/gece. `null` dilim temel ücrete düşer —
 * çözüm backend'de (`PricingCalculator.Resolve`: `rate ?? baseRate`).
 */
export interface BoatPricingInputModel {
  baseRate: number;
  weekdayMorningRate: number | null;
  weekdayEveningRate: number | null;
  weekdayNightRate: number | null;
  weekendMorningRate: number | null;
  weekendEveningRate: number | null;
  weekendNightRate: number | null;
}

export interface BoatPricingOutputModel {
  baseRate: number;
  weekdayMorningRate: number | null;
  weekdayEveningRate: number | null;
  weekdayNightRate: number | null;
  weekendMorningRate: number | null;
  weekendEveningRate: number | null;
  weekendNightRate: number | null;
}

/** Form durumu — `baseRate` daha girilmemişken `null` olabilir. */
export interface BoatPricingFormModel {
  baseRate: number | null;
  weekdayMorningRate: number | null;
  weekdayEveningRate: number | null;
  weekdayNightRate: number | null;
  weekendMorningRate: number | null;
  weekendEveningRate: number | null;
  weekendNightRate: number | null;
}

/**
 * `POST /api/Boats/pricing/preview` yanıtı — fiyatlandırma ekranındaki canlı
 * örnek hesap. Hesabın tamamı backend'de: dilim sınırları, boş dilimin temel
 * ücrete düşmesi, gece yarısı devri ve gruplama kuralı orada yaşıyor
 * (`PricingCalculator.Breakdown`). İstemci yalnızca basar.
 */
export interface PricingPreviewGroupOutputModel {
  /** Gösterime hazır tek metin — "hafta sonu akşam". */
  label: string;
  hours: number;
  hourRate: number;
  total: number;
}

export interface PricingPreviewExampleOutputModel {
  /** "Çarşamba 10:00–14:00 (4 saat)" — senaryo da başlık da backend'den gelir. */
  title: string;
  groups: PricingPreviewGroupOutputModel[];
  total: number;
}

export interface PricingPreviewOutputModel {
  examples: PricingPreviewExampleOutputModel[];
}
