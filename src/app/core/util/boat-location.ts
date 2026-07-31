import { BoatOutputModel, CityHarborsOutputModel } from '@models';

/**
 * Listelerde gösterilen konum: bağlı liman + şehir. Üç ekran aynı kuralı
 * kullanıyor (my-boats, tekne arama, tekne detayı) — kural tek yerde dursun
 * diye buraya alındı, boat-labels ile aynı gerekçe.
 */
export function formatBoatLocation(
  boat: BoatOutputModel,
  cities: CityHarborsOutputModel[],
  emptyText = '',
): string {
  const city = cities.find((c) => c.cityId === boat.cityId);
  const harbor = city?.harbors.find((h) => h.id === boat.primaryHarborId)?.name;
  if (!city) return harbor ?? emptyText;
  return harbor ? `${harbor}, ${city.cityName}` : city.cityName;
}
