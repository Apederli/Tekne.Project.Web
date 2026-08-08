import { booleanAttribute, Component, computed, input } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { HlmFieldImports } from '@ui/field';
import { HlmInput } from '@ui/input';

/**
 * Signal Forms alanına bağlı, etiket + hata gösterimini içeren metin girişi.
 * Kullanım: `<app-input label="Tekne adı" [field]="form.name" />`
 *
 * `app-select`'teki gibi bir `inputId` girdisi yok: `BrnInput` kendi id'sini
 * üretip `BrnField`'a labelable olarak kaydediyor, `hlmFieldLabel` de `for`'unu
 * oradan okuyor — etiket ile alan kendiliğinden eşleşiyor. Select'te bu iş elle
 * yapılıyor çünkü oradaki kontrol input değil, bir `<button>`.
 */
@Component({
  selector: 'app-input',
  imports: [FormField, HlmFieldImports, HlmInput],
  template: `
    <div hlmField>
      <label hlmFieldLabel>
        {{ label() }}
        @if (optional()) {
          <span class="font-normal text-muted-foreground">(isteğe bağlı)</span>
        }
      </label>
      <input
        hlmInput
        [type]="type()"
        [attr.step]="step()"
        [attr.autocomplete]="autocomplete()"
        [formField]="field()"
      />
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

  state = computed(() => this.field()());
}
