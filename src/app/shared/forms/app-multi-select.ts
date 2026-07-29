import { Component, computed, input, viewChild } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { BrnPopover } from '@spartan-ng/brain/popover';
import { HlmButton } from '@ui/button';
import { HlmCheckbox } from '@ui/checkbox';
import { HlmFieldImports } from '@ui/field';
import { HlmSelectImports } from '@ui/select';
import { SelectOption } from '@models';

let nextId = 0;

/**
 * Signal Forms alanına bağlı, etiket + hata gösterimini içeren çoklu select.
 * Öğelerin yanında seçim durumunu gösteren checkbox, panelin altında
 * Temizle / Tamam butonları vardır.
 *
 * Kullanım: `<app-multi-select label="Limanlar" [field]="form.harborIds" [options]="harborOptions()" />`
 */
@Component({
  selector: 'app-multi-select',
  imports: [FormField, HlmButton, HlmCheckbox, HlmFieldImports, HlmSelectImports],
  template: `
    <div hlmField>
      <label hlmFieldLabel [for]="selectId()">{{ label() }}</label>
      <hlm-select-multiple [formField]="field()" [itemToString]="itemToString">
        <hlm-select-trigger class="w-full" [buttonId]="selectId()">
          <hlm-select-value [placeholder]="placeholder()" />
        </hlm-select-trigger>
        <hlm-select-content *hlmSelectPortal>
          @for (option of options(); track option.value) {
            <hlm-select-item [value]="option.value">
              <hlm-checkbox class="pointer-events-none" [checked]="isSelected(option.value)" />
              <span class="ms-1.5">{{ option.label }}</span>
            </hlm-select-item>
          }
          <div class="border-border mt-1 flex items-center justify-between gap-2 border-t p-1.5">
            <button hlmBtn variant="ghost" size="sm" type="button" (click)="clear()">
              Temizle
            </button>
            <button hlmBtn size="sm" type="button" (click)="close()">Tamam</button>
          </div>
        </hlm-select-content>
      </hlm-select-multiple>
      @if (state().touched()) {
        @for (error of state().errors(); track error.kind) {
          <hlm-field-error forceShow>{{ error.message }}</hlm-field-error>
        }
      }
    </div>
  `,
})
export class AppMultiSelect {
  label = input.required<string>();
  field = input.required<FieldTree<number[]>>();
  options = input.required<SelectOption<number>[]>();
  placeholder = input('Seçin');
  selectId = input(`app-multi-select-${nextId++}`);

  popover = viewChild.required(BrnPopover);

  state = computed(() => this.field()());

  isSelected(value: number): boolean {
    return this.state().value().includes(value);
  }

  /**
   * Trigger'da seçili etiketleri virgülle birleştirir. Brain, çoklu seçimde
   * `itemToString`'e tek değer değil dizinin tamamını verir.
   */
  itemToString = (value: number | number[]): string =>
    Array.isArray(value)
      ? value.map((v) => this.optionLabel(v)).join(', ')
      : this.optionLabel(value);

  optionLabel(value: number): string {
    return this.options().find((o) => o.value === value)?.label ?? String(value);
  }

  clear(): void {
    this.state().value.set([]);
  }

  close(): void {
    this.popover().close();
  }
}
