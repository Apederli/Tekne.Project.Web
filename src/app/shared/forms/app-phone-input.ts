import { booleanAttribute, Component, computed, effect, input, signal } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { HlmComboboxImports } from '@ui/combobox';
import { HlmFieldImports } from '@ui/field';
import { HlmInput } from '@ui/input';
import { DialCodeOption } from '@models';
import { DIAL_CODES_SORTED, TURKEY_DIAL_CODE, countryName, flagEmoji } from './dial-codes.const';
import { ErrorMessagePipe } from './error-message-pipe';

let nextId = 0;
let nextTriggerId = 0;

/**
 * Signal Forms'a bağlı telefon girişi: solda aranabilir ülke kodu
 * combobox'ı, sağda yalnız-rakam telefon girişi. Form modelinin zorunlu
 * (required) string alanlarına iki ayrı alanla bağlanır; API'ye
 * map'lemeyi form yapar:
 * `<app-phone-input label="Telefon" [dialCodeField]="f.phoneNumberDialCode" [numberField]="f.phoneNumber" />`
 *
 * Görsel biçim ngx-mask ile: +90 seçiliyken `5XX XXX XX XX` gruplaması,
 * diğer ülkelerde ayraçsız yalnız-rakam maskesi. Model her durumda
 * boşluksuz düz rakam tutar (`dropSpecialCharacters` varsayılanı);
 * maskenin kendi validasyonu kapalı — hata üretimi formun işi.
 *
 * `app-select`'teki gibi elle `inputId`: etiketin `for`'u telefon
 * input'una bağlanır; combobox trigger butonu ise erişilebilir adını
 * `buttonId` ile eşlenen görsel-gizli (`sr-only`) bir `<label>`'dan alır.
 *
 * `dialCodeField` başlangıç değeri olarak `'+90'` verilmesi beklenir; boş
 * başlarsa kullanıcı ilk rakamı yazdığı anda ekranda gösterilen varsayılan
 * (TR) o alana yazılır — bkz. `normalize` effect'i.
 */
@Component({
  selector: 'app-phone-input',
  imports: [ErrorMessagePipe, FormField, HlmComboboxImports, HlmFieldImports, HlmInput, NgxMaskDirective],
  providers: [provideNgxMask()],
  template: `
    <div hlmField>
      <label hlmFieldLabel [for]="inputId()" [class.sr-only]="hideLabel()">
        {{ label() }}
        @if (optional()) {
          <span class="font-normal text-muted-foreground">(isteğe bağlı)</span>
        }
      </label>
      <div class="flex gap-2">
        @if (fixedCountry()) {
          <span [class]="fixedClass()">{{ flagEmoji(selected().iso2) }} {{ selected().dialCode }}</span>
        } @else {
        <label class="sr-only" [for]="triggerId()">Ülke kodu</label>
        <hlm-combobox
          [value]="selected()"
          (valueChange)="selectCountry($event)"
          [itemToString]="itemToString"
          [filterOptions]="filterOptions"
        >
          <hlm-combobox-trigger [class]="triggerClass()" [buttonId]="triggerId()">
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
        }
        <input
          hlmInput
          type="tel"
          inputmode="tel"
          autocomplete="tel-national"
          [class]="numberClass()"
          [id]="inputId()"
          [attr.placeholder]="placeholder()"
          [formField]="numberField()"
          [mask]="mask()"
          [validation]="false"
        />
      </div>
      @if (numberState().touched() || dialState().touched()) {
        @for (error of numberState().errors(); track error.kind) {
          <hlm-field-error forceShow>{{ error | errorMessage }}</hlm-field-error>
        }
        @for (error of dialState().errors(); track error.kind) {
          <hlm-field-error forceShow>{{ error | errorMessage }}</hlm-field-error>
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

  /** Verilirse telefon input'una basılır; `hideLabel` ile birlikte etiketsiz form kurar. */
  placeholder = input<string>();

  /**
   * Verilirse (iso2, örn. `"TR"`) ülke seçimi kilitlenir: combobox yerine
   * statik bayrak+kod gösterilir ve `dialCodeField` bu ülkenin koduna
   * sabitlenir. Acenta/tekne sahibi formları gibi yalnız TR numara kabul
   * eden yerler için.
   */
  fixedCountry = input<string>();

  /**
   * Etiketi yalnız görsel olarak gizler (`sr-only`) — ekran okuyucu için
   * kalır. Placeholder'lı kompakt formlarda (giriş/kayıt modalı) kullanılır.
   */
  hideLabel = input(false, { transform: booleanAttribute });

  /**
   * `lg`: giriş/kayıt modalındaki büyük görünüm — 56px, tam yuvarlak hat,
   * masaüstünde de `text-base`. Varsayılan boy formların geri kalanında.
   */
  size = input<'default' | 'lg'>('default');

  triggerClass = computed(() =>
    this.size() === 'lg'
      ? 'h-14 w-32 shrink-0 justify-between rounded-2xl px-4 text-base'
      : 'h-10 w-28 shrink-0 justify-between',
  );

  numberClass = computed(() =>
    this.size() === 'lg' ? 'min-w-0 flex-1 h-14 rounded-2xl px-4 md:text-base' : 'min-w-0 flex-1',
  );

  /** Kilitli ülkenin statik gösterimi — trigger'la aynı boy dili, etkileşim yok. */
  fixedClass = computed(() =>
    this.size() === 'lg'
      ? 'flex h-14 w-32 shrink-0 items-center rounded-2xl border border-input px-4 text-base'
      : 'flex h-10 w-28 shrink-0 items-center rounded-md border border-input px-3 text-sm',
  );

  inputId = input(`app-phone-input-${nextId++}`);

  /** Combobox trigger butonunun `sr-only` etiketiyle eşlenen id'si. */
  triggerId = input(`app-phone-trigger-${nextTriggerId++}`);

  countries = DIAL_CODES_SORTED;
  countryName = countryName;
  flagEmoji = flagEmoji;


  chosen = signal<DialCodeOption | null>(null);
  selected = computed(() => {
    const fixed = this.fixedCountry();
    if (fixed) return DIAL_CODES_SORTED.find((c) => c.iso2 === fixed) ?? TURKEY_DIAL_CODE;
    const dial = this.dialCodeField()().value();
    const chosen = this.chosen();
    if (chosen && chosen.dialCode === dial) return chosen;
    return DIAL_CODES_SORTED.find((c) => c.dialCode === dial) ?? TURKEY_DIAL_CODE;
  });

  /** Kilitli ülkede model her durumda o ülkenin koduna sabitlenir. */
  pinFixed = effect(() => {
    if (!this.fixedCountry()) return;
    const dialCode = this.selected().dialCode;
    if (this.dialCodeField()().value() !== dialCode) {
      this.dialCodeField()().value.set(dialCode);
    }
  });

  /**
   * +90: `5XX XXX XX XX` (10 hane, gruplu). Diğer ülkeler: ayraçsız, en çok
   * 15 hane (E.164 üst sınırı) — `9` ngx-mask'te isteğe bağlı rakam demek,
   * yani maske yalnız rakam kabulünü de üstlenir.
   */
  mask = computed(() =>
    this.selected().dialCode === '+90' ? '000 000 00 00' : '999999999999999',
  );

  /**
   * Model değerini normalize eder: ilk rakamla birlikte boş `dialCodeField`
   * ekranda seçili görünen koda sabitlenir; +90'da TR alışkanlığıyla yazılan
   * baştaki `0`(lar) sessizce atılır.
   */
  normalize = effect(() => {
    const value = this.numberField()().value();
    if (!value) return;
    if (!this.dialCodeField()().value()) {
      this.dialCodeField()().value.set(this.selected().dialCode);
    }
    if (this.selected().dialCode === '+90' && value.startsWith('0')) {
      this.numberField()().value.set(value.replace(/^0+/, ''));
    }
  });

  itemToString = (c: DialCodeOption): string => `${countryName(c.iso2)} ${c.dialCode}`;


  filterOptions = { locale: 'tr' } as const;

  selectCountry(country: DialCodeOption | null | undefined): void {
    if (!country) return;
    this.chosen.set(country);
    this.dialCodeField()().value.set(country.dialCode);
  }

  numberState = computed(() => this.numberField()());
  dialState = computed(() => this.dialCodeField()());
}
