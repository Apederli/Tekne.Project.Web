/**
 * `app-select` / `app-multi-select` sarmalayıcılarının seçenek modeli.
 *
 * Backend modeli değil, UI sözleşmesi: select'e liste veren taraf değerin
 * yanında görünen etiketi de taşır — trigger'daki ad gösterimi buradan çözülür.
 */
export interface SelectOption<T extends string | number = string | number> {
  value: T;
  label: string;
}

export interface IconSelectOption<
  T extends string | number = string | number,
> extends SelectOption<T> {
  icon: string;
  iconClass: string;
  disabled?: boolean;
}
