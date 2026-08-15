import { ParamMap, Params } from '@angular/router';
import { RentalType } from '@enums/rental-type';
import { BoatListFilterInputModel } from '@models';

/**
 * Saatlik sürenin tavanı. Backend'de `Rental:HourlyMaxHours` (appsettings.json)
 * ve `BoatValidators` içinde; istemciye açan bir uç yok, bu yüzden burada
 * sabit. Backend'de değişirse elle güncellenmesi gereken tek yer burasıdır.
 */
export const SEARCH_MAX_HOURS = 12;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function intInRange(raw: string | null, min: number, max: number): number | undefined {
  if (raw === null) return undefined;
  const value = Number(raw);
  return Number.isInteger(value) && value >= min && value <= max ? value : undefined;
}

function isoDate(raw: string | null): string | undefined {
  if (raw === null || !ISO_DATE.test(raw)) return undefined;
  // JS Date takvim taşmasını sessizce yuvarlıyor ('2026-02-30' → 2 Mart) ve
  // bu NaN üretmiyor. Geri çevirip karşılaştırmak hem taşmayı hem NaN'i
  // yakalar: geçersiz tarihte `toIsoDate` "NaN-NaN-NaN" döner, eşleşmez.
  return toIsoDate(fromIsoDate(raw)) === raw ? raw : undefined;
}

/**
 * `/tekneler` query string'ini API filtresine çevirir.
 *
 * Bozuk değer sessizce düşer: elle yazılmış URL bozuk ekran değil, o alanı yok
 * sayılmış bir arama üretir. İki kural ayrıştırmada uygulanır ki backend 400
 * dönmesin:
 *
 * - `harbor` ile `city` birlikte gelirse `harbor` kazanır (daha dar olan).
 * - Zincir: `date` yoksa `startHour`, `startHour` yoksa `hours` düşer
 *   (`BoatValidators` bu kombinasyonları reddediyor).
 */
export function parseSearchParams(map: ParamMap): BoatListFilterInputModel {
  const harborId = intInRange(map.get('harbor'), 1, Number.MAX_SAFE_INTEGER);
  const cityId =
    harborId === undefined ? intInRange(map.get('city'), 1, Number.MAX_SAFE_INTEGER) : undefined;

  const date = isoDate(map.get('date'));
  const startHour = date === undefined ? undefined : intInRange(map.get('startHour'), 0, 23);
  const hours =
    startHour === undefined ? undefined : intInRange(map.get('hours'), 1, SEARCH_MAX_HOURS);

  const filter: BoatListFilterInputModel = {
    cityId,
    harborId,
    date,
    startHour,
    hours,
    numberOfPeople: intInRange(map.get('people'), 1, Number.MAX_SAFE_INTEGER),
    pageNumber: intInRange(map.get('page'), 1, Number.MAX_SAFE_INTEGER),
  };

  // Panel saat cinsinden süre soruyor; gecelik tekneyi bu aramanın sonucunda
  // göstermek tutarsız olurdu (fiyat birimi ₺/gece, startHour anlamsız).
  // Aramasız /tekneler (yalnız ?page=) her tipi listelemeye devam eder.
  if (hasSearchFilter(filter)) filter.rentalType = RentalType.Hourly;

  return filter;
}

/** Sayfa numarası arama sayılmaz — `?page=2` tek başına listeyi kısıtlamaz. */
export function hasSearchFilter(filter: BoatListFilterInputModel): boolean {
  return (
    filter.cityId !== undefined ||
    filter.harborId !== undefined ||
    filter.date !== undefined ||
    filter.numberOfPeople !== undefined
  );
}

/**
 * Filtreyi query param'lara çevirir. Boş alanlar `null` yazılır ki
 * `queryParamsHandling: 'merge'` onları URL'den **silsin** — atlanan alan
 * merge'de eskisini bırakırdı.
 */
export function toQueryParams(filter: BoatListFilterInputModel): Params {
  return {
    city: filter.cityId ?? null,
    harbor: filter.harborId ?? null,
    date: filter.date ?? null,
    startHour: filter.startHour ?? null,
    hours: filter.hours ?? null,
    people: filter.numberOfPeople ?? null,
    // Yeni arama 1. sayfadan başlar: eski ?page= taşınırsa iki sonuçlu bir
    // aramada kullanıcı boş ekrana düşer.
    page: null,
  };
}

/**
 * Yerel tarihten `YYYY-MM-DD`. `toISOString()` bilinçli kullanılmıyor — UTC'ye
 * kaydırıp günü bir öne/arkaya atabiliyor; buradaki tarih bir takvim günü,
 * bir an değil.
 */
export function toIsoDate(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** `YYYY-MM-DD` → yerel gün başlangıcı. */
export function fromIsoDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}
