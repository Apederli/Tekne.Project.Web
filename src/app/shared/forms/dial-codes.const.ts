import { DialCodeOption } from '@models';

/**
 * E.164 ülke kodları — `app-phone-input`'un veri kaynağı.
 *
 * Bilinçli olarak KISA tutuluyor: hedef kitlenin (TR pazarı + turist/gurbetçi
 * kaynak ülkeleri) kapsadığı ~10 ülke yeter, tam ITU listesi taranabilirliği
 * öldürüyordu. Yeni ülke gerektiğinde buraya satır eklemek yeterli —
 * ad/bayrak/sıralama `iso2`'den türetiliyor.
 *
 * Sıralı DEĞİL: görünen sıra `DIAL_CODES_SORTED`'da Türkçe ada göre
 * kurulur. Bazı kodlar paylaşımlı olabilir (+1 gibi) — model yalnızca kodu
 * sakladığı için bu bir sorun değil; ekranda ülke seçimi bileşen içi
 * durumda tutulur.
 */
export const DIAL_CODES: DialCodeOption[] = [
  { iso2: 'TR', dialCode: '+90' },
  { iso2: 'DE', dialCode: '+49' },
  { iso2: 'GB', dialCode: '+44' },
  { iso2: 'US', dialCode: '+1' },
  { iso2: 'FR', dialCode: '+33' },
  { iso2: 'NL', dialCode: '+31' },
  { iso2: 'RU', dialCode: '+7' },
  { iso2: 'UA', dialCode: '+380' },
  { iso2: 'AZ', dialCode: '+994' },
  { iso2: 'GR', dialCode: '+30' },
];

/** Varsayılan seçim. Diziden REFERANS — combobox eşitliği `Object.is`. */
export const TURKEY_DIAL_CODE = DIAL_CODES.find((c) => c.iso2 === 'TR')!;

/*
 * Türkçe bölge adları. Modül yüklenirken bir kez kurulur; `Intl.DisplayNames`
 * hem tarayıcıda hem SSR'daki Node'da (full-icu) var. Yoksa (çok eski
 * ortam) adlar iso2 koduna düşer — bileşen yine çalışır.
 */
let regionNames: Intl.DisplayNames | undefined;
try {
  regionNames = new Intl.DisplayNames(['tr'], { type: 'region' });
} catch {
  regionNames = undefined;
}

/** iso2 → Türkçe ülke adı (bulunamazsa iso2'nin kendisi). */
export function countryName(iso2: string): string {
  return regionNames?.of(iso2) ?? iso2;
}

/** iso2 → bayrak emojisi (regional indicator çifti; asset yok). */
export function flagEmoji(iso2: string): string {
  return [...iso2].map((ch) => String.fromCodePoint(0x1f1a5 + ch.charCodeAt(0))).join('');
}

const collator = new Intl.Collator('tr');

/** Combobox'ta gösterilen liste — Türkçe ada göre sıralı. */
export const DIAL_CODES_SORTED: DialCodeOption[] = [...DIAL_CODES].sort((a, b) =>
  collator.compare(countryName(a.iso2), countryName(b.iso2)),
);
