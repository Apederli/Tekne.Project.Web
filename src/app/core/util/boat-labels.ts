import { BoatType, RentalType } from '@enums';

/**
 * Enum → kullanıcıya görünen Türkçe etiket. Üçüncü kopya çıkmadan tek yere
 * alındı (my-boats + boat-detail kullanıyor); form seçenekleri kendi
 * `{value, label}` dizilerini bu haritalardan bağımsız kurmayı sürdürür.
 */
export const BOAT_TYPE_LABELS: Record<BoatType, string> = {
  [BoatType.Sailboat]: 'Yelkenli',
  [BoatType.MotorYacht]: 'Motor yat',
  [BoatType.Catamaran]: 'Katamaran',
  [BoatType.Gulet]: 'Gulet',
};

export const RENTAL_TYPE_LABELS: Record<RentalType, string> = {
  [RentalType.Hourly]: 'Saatlik',
  [RentalType.Daily]: 'Günlük',
};
