import { booleanAttribute, Component, computed, input } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { HlmFieldImports } from '@ui/field';
import { HlmInputGroupImports } from '@ui/input-group';
import { ErrorMessagePipe } from './error-message-pipe';

/**
 * Signal Forms'a bağlı tutar (TL) girişi: binlik ayraçlı maske (1500 → 1.500),
 * sağda "TL" soneki, mobilde sayısal klavye. Kuruş yok — tam TL.
 * (₺ ikonu denendi, kullanıcı "TL" ibaresini tercih etti — 2026-08-11.)
 *
 * Model `number | null` tutar: boş giriş `null` olur (`0` değil), böylece
 * "boş dilim temel ücrete düşer" gibi kurallar sıfırla karışmaz. Maske eksi
 * işaretini hiç kabul etmez (`allowNegativeNumbers` varsayılanı kapalı) —
 * formların ayrıca "0'dan büyük" mesajı üretmesi gerekmez.
 *
 * `[formField]` + `mask` kompozisyonu app-phone-input'taki desenin aynısı;
 * sayı ↔ maskeli metin dönüşümünü `inputTransformFn`/`outputTransformFn`
 * çifti yapar (maske ayraçları `dropSpecialCharacters` ile zaten düşürür).
 */
@Component({
  selector: 'app-amount-input',
  imports: [ErrorMessagePipe, FormField, HlmFieldImports, HlmInputGroupImports, NgxMaskDirective],
  providers: [provideNgxMask()],
  template: `
    <div hlmField>
      <label hlmFieldLabel [class.sr-only]="hideLabel()">
        {{ label() }}
        @if (optional()) {
          <span class="font-normal text-muted-foreground">(isteğe bağlı)</span>
        }
      </label>
      <div hlmInputGroup [class]="cellClass()">
        <!--
          $any: şablon tip denetçisi type="text" input'ta Field<string> dayatıyor
          (FormField, denetçiye "control directive" olarak işaretli); değer akışı
          gerçekte input/outputTransformFn çiftiyle number|null'a çevriliyor.
          Bileşenin dış API'si FieldTree<number | null> olarak tam tipli kalıyor —
          kaçış yalnız bu iç bağlamada.
        -->
        <input
          hlmInputGroupInput
          type="text"
          inputmode="numeric"
          [attr.placeholder]="placeholder()"
          [formField]="$any(field())"
          mask="separator.0"
          thousandSeparator="."
          [validation]="false"
          [inputTransformFn]="fromModel"
          [outputTransformFn]="toModel"
        />
        <hlm-input-group-addon align="inline-end">TL</hlm-input-group-addon>
      </div>
      @if (state().touched()) {
        @for (error of state().errors(); track error.kind) {
          <hlm-field-error forceShow>{{ error | errorMessage }}</hlm-field-error>
        }
      }
    </div>
  `,
})
export class AppAmountInput {
  label = input.required<string>();

  field = input.required<FieldTree<number | null>>();

  optional = input(false, { transform: booleanAttribute });

  placeholder = input<string>();

  hideLabel = input(false, { transform: booleanAttribute });

  state = computed(() => this.field()());

  /**
   * Matris hücresi görünümü: boş hücre kesikli çerçeveyle "doldurulmamış"
   * hissi verir, dolu hücre yeşil vurgu alır — neyin girilmiş, neyin temel
   * ücretten geldiği tek bakışta ayrışsın (fiyatlandırma yeniden tasarımı,
   * 2026-08-11). Bileşen kendi değerine bakar; dışarıdan kablolama yok.
   */
  cell = input(false, { transform: booleanAttribute });

  cellClass = computed(() => {
    if (!this.cell()) return '';
    return this.state().value() !== null
      ? 'border-primary-deep bg-primary/10'
      : 'border-dashed';
  });

  /** Model → input: sayı ngx-mask'a olduğu gibi verilir (maskeyi o basar); boş model boş metin. */
  fromModel = (value: unknown): string | number => (value == null ? '' : (value as number));

  /** Input → model: ayraçları düşmüş rakam dizisi gelir; boşsa `null`. */
  toModel = (value: string | number | undefined | null): number | null => {
    const s = String(value ?? '').trim();
    return s === '' ? null : Number(s);
  };
}
