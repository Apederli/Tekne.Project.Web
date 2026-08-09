import { booleanAttribute, Component, computed, input, viewChild } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { BrnPopover } from '@spartan-ng/brain/popover';
import { HlmButton } from '@ui/button';
import { HlmCheckbox } from '@ui/checkbox';
import { HlmComboboxImports } from '@ui/combobox';
import { HlmFieldImports } from '@ui/field';
import { SelectOption } from '@models';

let nextId = 0;

@Component({
  selector: 'app-multi-select',
  imports: [FormField, HlmButton, HlmCheckbox, HlmComboboxImports, HlmFieldImports],
  template: `
    <div hlmField>
      <label hlmFieldLabel [for]="inputId()">{{ label() }}</label>
      <hlm-combobox-multiple [formField]="field()" [itemToString]="itemToString">
        <hlm-combobox-chips class="min-h-10">
          <ng-container *hlmComboboxValues="let values">
            @for (value of values; track value) {
              <hlm-combobox-chip [value]="value">{{ optionLabel(value) }}</hlm-combobox-chip>
            }
          </ng-container>
          <input
            hlmComboboxChipInput
            [id]="inputId()"
            [readOnly]="!search()"
            [placeholder]="inputPlaceholder()"
          />
        </hlm-combobox-chips>

        <hlm-combobox-content *hlmComboboxPortal>
          <div hlmComboboxList>
            @for (option of options(); track option.value) {
              <hlm-combobox-item [value]="option.value" [showCheck]="false">
                <hlm-checkbox class="pointer-events-none" [checked]="isSelected(option.value)" />
                <span class="ms-1.5">{{ option.label }}</span>
              </hlm-combobox-item>
            }
            @if (search()) {
              <hlm-combobox-empty class="text-muted-foreground block p-2 text-sm">
                Sonuç bulunamadı.
              </hlm-combobox-empty>
            }
          </div>
          <div class="border-border flex items-center justify-between gap-2 border-t p-1.5">
            <button hlmBtn variant="ghost" size="sm" type="button" (click)="clear()">
              Temizle
            </button>
            <button hlmBtn size="sm" type="button" (click)="close()">Tamam</button>
          </div>
        </hlm-combobox-content>
      </hlm-combobox-multiple>
      @if (state().touched()) {
        @for (error of state().errors(); track error.kind) {
          <hlm-field-error forceShow>{{ error.message }}</hlm-field-error>
        }
      }
    </div>
  `,
})
export class AppMultiSelect<T extends string | number> {
  label = input.required<string>();
  field = input.required<FieldTree<T[]>>();
  options = input.required<SelectOption<T>[]>();
  placeholder = input('Seçin');

  search = input(false, { transform: booleanAttribute });

  inputId = input(`app-multi-select-${nextId++}`);

  popover = viewChild.required(BrnPopover);

  state = computed(() => this.field()());

  inputPlaceholder = computed(() => (this.state().value().length > 0 ? '' : this.placeholder()));

  isSelected(value: T): boolean {
    return this.state().value().includes(value);
  }

  itemToString = (value: T | T[]): string =>
    Array.isArray(value)
      ? value.map((v) => this.optionLabel(v)).join(', ')
      : this.optionLabel(value);

  optionLabel(value: T): string {
    return this.options().find((o) => o.value === value)?.label ?? String(value);
  }

  clear(): void {
    this.state().value.set([]);
  }

  close(): void {
    this.popover().close();
  }
}
