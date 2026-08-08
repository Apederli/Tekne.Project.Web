import { booleanAttribute, Component, computed, input, signal } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideEye,
  lucideEyeOff,
  lucideLock,
  lucideMail,
  lucidePhone,
  lucideUser,
} from '@ng-icons/lucide';
import { HlmFieldImports } from '@ui/field';
import { HlmInputGroupImports } from '@ui/input-group';

/**
 * `icon` girdisinin kabul ettiği kısa adlar → lucide ikon adları.
 * Yeni ikon gerektiğinde buraya eklenir; `provideIcons` da güncellenmeli.
 */
const ICON_MAP = {
  user: 'lucideUser',
  mail: 'lucideMail',
  lock: 'lucideLock',
  phone: 'lucidePhone',
} as const;

export type AppInputIcon = keyof typeof ICON_MAP;

/**
 * Signal Forms alanına bağlı, etiket + hata gösterimini içeren metin girişi.
 * Kullanım: `<app-input label="Tekne adı" [field]="form.name" />`
 *
 * Kontrol, `hlmInputGroup` sarmalayıcısıyla çizilir: `icon` verilirse başa
 * ikon eklenir, `type="password"` ise sona göster/gizle düğmesi gelir.
 * İkisi de verilmediğinde grup görsel olarak yalın input ile aynıdır.
 *
 * `app-select`'teki gibi bir `inputId` girdisi yok: `BrnInput` kendi id'sini
 * üretip `BrnField`'a labelable olarak kaydediyor, `hlmFieldLabel` de `for`'unu
 * oradan okuyor — etiket ile alan kendiliğinden eşleşiyor. Select'te bu iş elle
 * yapılıyor çünkü oradaki kontrol input değil, bir `<button>`.
 */
@Component({
  selector: 'app-input',
  imports: [FormField, HlmFieldImports, HlmInputGroupImports, NgIcon],
  viewProviders: [
    provideIcons({ lucideEye, lucideEyeOff, lucideLock, lucideMail, lucidePhone, lucideUser }),
  ],
  template: `
    <div hlmField>
      <label hlmFieldLabel [class.sr-only]="hideLabel()">
        {{ label() }}
        @if (optional()) {
          <span class="font-normal text-muted-foreground">(isteğe bağlı)</span>
        }
      </label>
      <div hlmInputGroup [class]="groupClass()">
        @if (iconName(); as name) {
          <hlm-input-group-addon><ng-icon [name]="name" /></hlm-input-group-addon>
        }
        <input
          hlmInputGroupInput
          [type]="effectiveType()"
          [attr.step]="step()"
          [attr.autocomplete]="autocomplete()"
          [attr.placeholder]="placeholder()"
          [formField]="field()"
        />
        @if (type() === 'password') {
          <hlm-input-group-addon align="inline-end">
            <button
              hlmInputGroupButton
              size="icon-sm"
              [attr.aria-label]="revealed() ? 'Şifreyi gizle' : 'Şifreyi göster'"
              [attr.aria-pressed]="revealed()"
              (click)="revealed.set(!revealed())"
            >
              <ng-icon [name]="revealed() ? 'lucideEye' : 'lucideEyeOff'" />
            </button>
          </hlm-input-group-addon>
        }
      </div>
      @if (state().touched()) {
        @for (error of state().errors(); track error.kind) {
          <hlm-field-error forceShow>{{ error.message }}</hlm-field-error>
        }
      }
    </div>
  `,
})
export class AppInput {
  label = input.required<string>();

  /**
   * Birleşim tipi bilinçli — generic (`AppInput<T>`) denenmemeli: `FieldTree`
   * gövdesindeki `[TModel] extends [AbstractControl]` koşulu, `T` çözülmemiş
   * bir tip parametresiyken değerlendirilemiyor ve şablon derleyicisi
   * `[formField]` bağlamasını reddediyor. Birleşim hem `FieldTree<string>`'i
   * hem `FieldTree<number | null>`'ü kabul ediyor, generic'e gerek kalmıyor.
   */
  field = input.required<FieldTree<string | number | null>>();

  type = input<'text' | 'number' | 'email' | 'password' | 'tel'>('text');

  /** `type="number"` alanlarında ondalık adımı; verilmezse attribute basılmaz. */
  step = input<string>();

  /** Tarayıcı otomatik doldurması (`email`, `new-password` …); verilmezse basılmaz. */
  autocomplete = input<string>();

  /** Etiketin yanına "(isteğe bağlı)" notunu ekler. */
  optional = input(false, { transform: booleanAttribute });

  /** Verilirse input'a basılır; `hideLabel` ile birlikte etiketsiz form kurar. */
  placeholder = input<string>();

  /**
   * Etiketi yalnız görsel olarak gizler (`sr-only`) — ekran okuyucu için
   * kalır. Placeholder'lı kompakt formlarda (giriş/kayıt modalı) kullanılır.
   */
  hideLabel = input(false, { transform: booleanAttribute });

  /** Alanın başına çizilen ikon; `ICON_MAP`'teki kısa adlardan biri. */
  icon = input<AppInputIcon>();

  /**
   * `lg`: giriş/kayıt modalındaki büyük görünüm — 56px, tam yuvarlak hat,
   * masaüstünde de `text-base`. Varsayılan boy formların geri kalanında.
   */
  size = input<'default' | 'lg'>('default');

  /** `type="password"` alanında şifrenin açık gösterilip gösterilmediği. */
  revealed = signal(false);

  iconName = computed(() => {
    const icon = this.icon();
    return icon ? ICON_MAP[icon] : undefined;
  });

  effectiveType = computed(() =>
    this.type() === 'password' && this.revealed() ? 'text' : this.type(),
  );

  groupClass = computed(() =>
    this.size() === 'lg'
      ? 'h-14 rounded-2xl [&>[data-align=inline-start]]:ps-4 [&>[data-align=inline-end]]:pe-3 ' +
        '[&_ng-icon]:text-[length:--spacing(5.5)] *:data-[slot=input-group-control]:md:text-base'
      : '',
  );

  state = computed(() => this.field()());
}
