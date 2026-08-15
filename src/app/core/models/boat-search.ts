import { RentalType } from '@enums/rental-type';

/**
 * Arama panelinin form modeli. API filtresinden ayrı bir tip: burada değerler
 * kontrol tiplerinde tutulur (`location` tek combobox değeri, `date` bir
 * `Date`), API'ye çevrim `boat-search-params` üzerinden yapılır.
 */
export interface BoatSearchFormModel {
  /**
   * `city:3` | `harbor:7` | `''` | `null`. İki kimlik uzayı tek combobox
   * değerinde. `null`, `BrnCombobox.resetValue()`'nun yazdığı değer — X'e
   * tıklanınca veya arama kutusu boşaltılınca combobox `''` değil `null`
   * yazıyor; tip burada onu kabul etmezse `search()` boş konumda patlar.
   */
  location: string | null;
  /** `RentalType` değeri; `app-toggle-group` sözleşmesi gereği `''` de kabul eder. */
  rentalType: RentalType;
  date: Date | null;
  /** `hlm-select` string taşır: `''` | `'0'` … `'23'`. */
  startHour: string;
  hours: number | null;
  checkIn: Date | null;
  checkOut: Date | null;
  people: number | null;
}
