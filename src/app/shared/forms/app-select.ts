import { booleanAttribute, Component, computed, input, output } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { HlmFieldImports } from '@ui/field';
import { HlmSelectImports } from '@ui/select';
import { SelectOption } from '@models';

let nextId = 0;

/**
 * Signal Forms alanına bağlı, etiket + hata gösterimini içeren tekli select.
 * Kullanım: `<app-select label="Şehir" [field]="form.cityId" [options]="cityOptions()" />`
 */
@Component({
  selector: 'app-select',
  imports: [FormField, HlmFieldImports, HlmSelectImports],
  template: `
    <div hlmField>
      <label hlmFieldLabel [for]="selectId()">
        {{ label() }}
        @if (optional()) {
          <span class="font-normal text-muted-foreground">(isteğe bağlı)</span>
        }
      </label>
      <hlm-select
        [formField]="field()"
        [itemToString]="itemToString"
        (valueChange)="valueChange.emit()"
      >
        <hlm-select-trigger class="w-full" [buttonId]="selectId()">
          <hlm-select-value [placeholder]="placeholder()" />
        </hlm-select-trigger>
        <hlm-select-content *hlmSelectPortal>
          @for (option of options(); track option.value) {
            <hlm-select-item [value]="option.value">{{ option.label }}</hlm-select-item>
          }
        </hlm-select-content>
      </hlm-select>
      @if (state().touched()) {
        @for (error of state().errors(); track error.kind) {
          <hlm-field-error forceShow>{{ error.message }}</hlm-field-error>
        }
      }
    </div>
  `,
})
export class AppSelect {
  label = input.required<string>();
  field = input.required<FieldTree<string>>();
  options = input.required<SelectOption<string>[]>();
  placeholder = input('Seçin');
  optional = input(false, { transform: booleanAttribute });
  selectId = input(`app-select-${nextId++}`);

  /** Seçim değiştiğinde tetiklenir; yeni değer `field` üzerinden okunur. */
  valueChange = output<void>();

  state = computed(() => this.field()());

  /** Trigger'da ham değer yerine seçeneğin etiketini gösterir. */
  itemToString = (value: string): string =>
    this.options().find((o) => o.value === value)?.label ?? value;
}
