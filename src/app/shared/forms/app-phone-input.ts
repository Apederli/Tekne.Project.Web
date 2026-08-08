import { booleanAttribute, Component, computed, input, signal } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { HlmComboboxImports } from '@ui/combobox';
import { HlmFieldImports } from '@ui/field';
import { HlmInput } from '@ui/input';
import { DialCodeOption } from '@models';
import { DIAL_CODES_SORTED, TURKEY_DIAL_CODE, countryName, flagEmoji } from './dial-codes.const';

let nextId = 0;
let nextTriggerId = 0;

/**
 * Signal Forms'a bağlı telefon girişi: solda aranabilir ülke kodu
 * combobox'ı, sağda yalnız-rakam telefon girişi. Form modelinin zorunlu
 * (required) string alanlarına iki ayrı alanla bağlanır; API'ye
 * map'lemeyi form yapar:
 * `<app-phone-input label="Telefon" [dialCodeField]="f.phoneNumberDialCode" [numberField]="f.phoneNumber" />`
 *
 * `app-select`'teki gibi elle `inputId`: etiketin `for`'u telefon
 * input'una bağlanır; combobox trigger butonu ise erişilebilir adını
 * `buttonId` ile eşlenen görsel-gizli (`sr-only`) bir `<label>`'dan alır.
 *
 * `dialCodeField` başlangıç değeri olarak `'+90'` verilmesi beklenir; boş
 * başlarsa kullanıcı ilk rakamı yazdığı anda ekranda gösterilen varsayılan
 * (TR) o alana yazılır — bkz. `sanitize()`.
 */
@Component({
  selector: 'app-phone-input',
  imports: [FormField, HlmComboboxImports, HlmFieldImports, HlmInput],
  template: `
    <div hlmField>
      <label hlmFieldLabel [for]="inputId()">
        {{ label() }}
        @if (optional()) {
          <span class="font-normal text-muted-foreground">(isteğe bağlı)</span>
        }
      </label>
      <div class="flex gap-2">
        <label class="sr-only" [for]="triggerId()">Ülke kodu</label>
        <hlm-combobox
          [value]="selected()"
          (valueChange)="selectCountry($event)"
          [itemToString]="itemToString"
          [filterOptions]="filterOptions"
        >
          <hlm-combobox-trigger class="w-28 shrink-0 justify-between" [buttonId]="triggerId()">
            <span>{{ flagEmoji(selected().iso2) }} {{ selected().dialCode }}</span>
          </hlm-combobox-trigger>
          <hlm-combobox-content *hlmComboboxPortal class="min-w-72">
            <hlm-combobox-input showTrigger="false" placeholder="Ülke ara…" />
            <hlm-combobox-empty>Ülke bulunamadı.</hlm-combobox-empty>
            <div hlmComboboxList class="max-h-64">
              @for (country of countries; track country.iso2) {
                <hlm-combobox-item [value]="country">
                  <span class="me-2">{{ flagEmoji(country.iso2) }}</span>
                  {{ countryName(country.iso2) }}
                  <span class="ms-auto ps-4 text-muted-foreground">{{ country.dialCode }}</span>
                </hlm-combobox-item>
              }
            </div>
          </hlm-combobox-content>
        </hlm-combobox>
        <input
          hlmInput
          type="tel"
          inputmode="tel"
          autocomplete="tel-national"
          class="min-w-0 flex-1"
          [id]="inputId()"
          [formField]="numberField()"
          (input)="sanitize($event)"
        />
      </div>
      @if (numberState().touched() || dialState().touched()) {
        @for (error of numberState().errors(); track error.kind) {
          <hlm-field-error forceShow>{{ error.message }}</hlm-field-error>
        }
        @for (error of dialState().errors(); track error.kind) {
          <hlm-field-error forceShow>{{ error.message }}</hlm-field-error>
        }
      }
    </div>
  `,
})
export class AppPhoneInput {
  label = input.required<string>();

  /** Form modelindeki `phoneNumberDialCode` alanı (örn. `+90`); API'ye map'lemeyi form yapar. */
  dialCodeField = input.required<FieldTree<string>>();

  /** Form modelindeki `phoneNumber` alanı — yalnız rakam tutulur; API'ye map'lemeyi form yapar. */
  numberField = input.required<FieldTree<string>>();

  /** Etiketin yanına "(isteğe bağlı)" notunu ekler. */
  optional = input(false, { transform: booleanAttribute });

  inputId = input(`app-phone-input-${nextId++}`);

  /** Combobox trigger butonunun `sr-only` etiketiyle eşlenen id'si. */
  triggerId = input(`app-phone-trigger-${nextTriggerId++}`);

  countries = DIAL_CODES_SORTED;
  countryName = countryName;
  flagEmoji = flagEmoji;

  /**
   * Ekranda gösterilen ülke. Kod paylaşımlı olduğu için (+1 gibi) son
   * SEÇİLEN ülke burada tutulur; alan değeri dışarıdan geldiyse (profil
   * doldurma gibi) koda göre ilk eşleşmeye, o da yoksa TR'ye düşülür.
   */
  chosen = signal<DialCodeOption | null>(null);
  selected = computed(() => {
    const dial = this.dialCodeField()().value();
    const chosen = this.chosen();
    if (chosen && chosen.dialCode === dial) return chosen;
    return DIAL_CODES_SORTED.find((c) => c.dialCode === dial) ?? TURKEY_DIAL_CODE;
  });

  /** Arama bu metinde yapılır: ad + kod ("alm" de "+49" da bulur). */
  itemToString = (c: DialCodeOption): string => `${countryName(c.iso2)} ${c.dialCode}`;

  /**
   * Arama collator'ını `DIAL_CODES_SORTED`'daki sıralamayla aynı locale'e
   * (`tr`) sabitler; aksi halde ziyaretçinin tarayıcı locale'i kullanılır.
   * `BrnCombobox` bunu enjekte edilen varsayılan `filterOptions` ile
   * (`usage: 'search'`, `sensitivity: 'base'`, `ignorePunctuation: true`)
   * birleştirir (merge), üzerine yazmaz — bu yüzden burada yalnızca
   * `locale` vermek yeterli.
   */
  filterOptions = { locale: 'tr' } as const;

  selectCountry(country: DialCodeOption | null | undefined): void {
    if (!country) return;
    this.chosen.set(country);
    this.dialCodeField()().value.set(country.dialCode);
  }

  /** Rakam dışı her şeyi anında temizler (yapıştırma dahil). */
  sanitize(event: Event): void {
    const el = event.target as HTMLInputElement;
    const clean = el.value.replace(/\D/g, '');
    if (clean && !this.dialCodeField()().value()) {
      this.dialCodeField()().value.set(this.selected().dialCode);
    }
    if (clean !== el.value) {
      el.value = clean;
      this.numberField()().value.set(clean);
    }
  }

  numberState = computed(() => this.numberField()());
  dialState = computed(() => this.dialCodeField()());
}
