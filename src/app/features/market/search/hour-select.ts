import { Component, computed, input } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { NgIcon } from '@ng-icons/core';
import { HlmFieldImports } from '@ui/field';
import { HlmSelectImports } from '@ui/select';
import { IconSelectOption } from '@models';

let nextId = 0;

@Component({
  selector: 'app-hour-select',
  imports: [FormField, HlmFieldImports, HlmSelectImports, NgIcon],
  template: `
    <div hlmField>
      <label hlmFieldLabel [for]="selectId()">{{ label() }}</label>
      <!-- $any: FormField'ın AbstractControl koşullu tipi çıplak generic T ile
           çözülemiyor; dış API (field ↔ options) tipli, köprü yalnız burada. -->
      <hlm-select [formField]="$any(field())" [itemToString]="itemToString">
        <hlm-select-trigger [buttonId]="selectId()" class="h-11 w-full">
          @if (selected(); as option) {
            <ng-icon
              [name]="option.icon"
              [class]="'size-4 ' + option.iconClass"
              aria-hidden="true"
            />
          }
          <hlm-select-value [placeholder]="placeholder()" />
        </hlm-select-trigger>
        <hlm-select-content *hlmSelectPortal class="max-h-80">
          <hlm-select-group>
            @for (option of options(); track option.value) {
              <hlm-select-item [value]="option.value" [disabled]="option.disabled ?? false">
                <ng-icon
                  [name]="option.icon"
                  [class]="'size-4 ' + option.iconClass"
                  aria-hidden="true"
                />
                {{ option.label }}
              </hlm-select-item>
            }
          </hlm-select-group>
        </hlm-select-content>
      </hlm-select>
    </div>
  `,
})
export class HourSelect<T extends string | number | null> {
  label = input.required<string>();
  field = input.required<FieldTree<T>>();
  options = input.required<IconSelectOption<NonNullable<T>>[]>();
  placeholder = input('Seçin');
  selectId = input(`app-hour-select-${nextId++}`);

  selected = computed(() => {
    const value = this.field()().value();
    return this.options().find((option) => Object.is(option.value, value)) ?? null;
  });

  itemToString = (value: T): string =>
    this.options().find((option) => Object.is(option.value, value))?.label ?? '';
}
