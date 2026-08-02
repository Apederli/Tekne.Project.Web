import { Component, input, output } from '@angular/core';
import { HlmCheckboxImports } from '@ui/checkbox';
import { HlmLabel } from '@ui/label';
import { SelectOption } from '@models';

let nextId = 0;

/**
 * Checkbox görünümlü, **gruptan tek seçim** kümesi. Seçili olana tekrar
 * basmak seçimi kaldırır.
 *
 * Neden radio değil: seçim opsiyonel — "bu gruptan hiçbiri" geçerli bir durum
 * ve yeni kayıtta başlangıç hâli o. Native radio bir kez seçilince
 * temizlenemediği için o duruma dönmek ancak yapay bir "Farketmez" seçeneği
 * veya ayrı bir temizle butonuyla mümkün olurdu; checkbox'ta ise seçimi
 * kaldırmak zaten doğal davranış.
 *
 * Bedeli, checkbox'ın görsel olarak "birden fazla seçilebilir" ima etmesi.
 * `hint` bu yüzden varsayılan olarak dolu ve `aria-describedby` ile gruba
 * bağlı — kısıt, kullanıcı ilk tıklamadan önce yazılı olarak söylenir.
 *
 * Kullanım:
 * `<app-single-check-group label="Sigara" [options]="opts()" [value]="v()" (valueChange)="set($event)" />`
 */
@Component({
  selector: 'app-single-check-group',
  imports: [HlmCheckboxImports, HlmLabel],
  template: `
    <div class="flex flex-col gap-1">
      @if (label(); as text) {
        <div class="flex flex-wrap items-baseline gap-x-2">
          <span class="text-sm font-medium">{{ text }}</span>
          @if (hint(); as hintText) {
            <span class="text-xs text-muted-foreground" [id]="hintId()">{{ hintText }}</span>
          }
        </div>
      }

      <div role="group" [attr.aria-describedby]="hint() ? hintId() : null">
        @for (option of options(); track option.value) {
          <label hlmLabel class="min-h-10 cursor-pointer gap-3 rounded-md px-2 hover:bg-accent">
            <hlm-checkbox
              [checked]="option.value === value()"
              (checkedChange)="onToggle(option.value, $event)"
            />
            <span class="font-normal">{{ option.label }}</span>
          </label>
        }
      </div>
    </div>
  `,
})
export class AppSingleCheckGroup<T extends string | number = string | number> {
  /** Kümenin üstünde çizilen başlık. Boş bırakılırsa başlık da ipucu da çizilmez. */
  label = input<string>();
  options = input.required<SelectOption<T>[]>();

  /** Seçili seçeneğin değeri; `null` hiçbiri seçili değil demektir. */
  value = input.required<T | null>();

  /** Tek seçim kısıtını yazıya döken not. Boş verilirse gösterilmez. */
  hint = input<string>('Yalnızca biri seçilebilir');

  hintId = input(`app-single-check-group-${nextId++}`);

  valueChange = output<T | null>();

  /**
   * İşaretlenen seçenek yeni değer olur; işareti kaldırılan seçenek grubu
   * boşaltır. Seçili olmayanların `checked`'i zaten `false` olduğu için
   * "diğerini kaldır" adımına gerek yok — değeri değiştirmek yetiyor.
   */
  onToggle(optionValue: T, checked: boolean): void {
    this.valueChange.emit(checked ? optionValue : null);
  }
}
