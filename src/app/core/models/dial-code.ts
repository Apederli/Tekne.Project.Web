/**
 * Telefon ülke kodu seçeneği (`app-phone-input`).
 *
 * Ülke ADI burada tutulmaz: Türkçe adlar çalışma anında
 * `Intl.DisplayNames('tr', { type: 'region' })` ile iso2'den üretilir —
 * 240 ülke adını elle yazmak hem hacim hem bakım yükü olurdu.
 */
export interface DialCodeOption {
  /** ISO 3166-1 alpha-2 bölge kodu (`Intl.DisplayNames` girdisi). */
  iso2: string;
  /** E.164 ülke kodu, `+` önekiyle (örn. `+90`). */
  dialCode: string;
}
