/**
 * Detay URL'i slug'ı: `{ad-slug}-{id}` (örn. `mavi-ruzgar-5`).
 *
 * Gerçek kaynak id'dir — ad kısmı yalnızca SEO içindir ve hiçbir yerde
 * doğrulanmaz. Bu yüzden ad değişse de eski linkler çalışmaya devam eder.
 */

const TURKISH_TO_ASCII: Record<string, string> = {
  ç: 'c',
  ğ: 'g',
  ı: 'i',
  ö: 'o',
  ş: 's',
  ü: 'u',
};

export function makeBoatSlug(name: string, id: number): string {
  // id backend PK'sıdır; sözleşme dışı değer sessizce yanlış slug üretmek
  // yerine anında patlamalı. Yanlış round-trip üretmeye izin vermek hata bulunmasını geciktirir.
  // Bu throw kart render'ı sırasında fırlar, yani tek bozuk kayıt tüm ızgarayı
  // kırar — yine de tercih edilen yol bu, çünkü bozuk id sessizce yayına çıkmamalı.
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`makeBoatSlug: id pozitif tamsayı olmalı (${id})`);
  }

  // `toLocaleLowerCase('tr')`: ASCII "I" Türkçe kuralla "ı"ya iner, harita
  // onu da "i"ye çevirir — "ISPARTA" → "isparta".
  const base = name
    .toLocaleLowerCase('tr')
    .replace(/[çğıöşü]/g, (ch) => TURKISH_TO_ASCII[ch])
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base ? `${base}-${id}` : String(id);
}

/** Sondaki `-{sayı}` parçasını çözer; yoksa veya pozitif değilse `null`. */
export function parseBoatIdFromSlug(slug: string): number | null {
  const match = /(\d+)$/.exec(slug);
  if (!match) return null;
  const id = Number(match[1]);
  return id > 0 ? id : null;
}
