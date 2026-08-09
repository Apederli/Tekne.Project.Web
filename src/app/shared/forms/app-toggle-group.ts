import { Component, computed, input } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { HlmFieldImports } from '@ui/field';
import { HlmToggleGroupImports } from '@ui/toggle-group';
import { SelectOption } from '@models';
import { ErrorMessagePipe } from './error-message-pipe';

/**
 * Signal Forms alanına bağlı, etiket + hata gösterimini içeren tekli toggle grubu.
 * Kullanım: `<app-toggle-group label="Tekne tipi" [field]="form.boatType" [options]="boatTypeOptions" />`
 */
@Component({
  selector: 'app-toggle-group',
  imports: [ErrorMessagePipe, FormField, HlmFieldImports, HlmToggleGroupImports],
  template: `
    <div hlmField>
      <span hlmFieldLabel>{{ label() }}</span>
      <hlm-toggle-group type="single" variant="outline" [formField]="field()">
        @for (option of options(); track option.value) {
          <button hlmToggleGroupItem type="button" [value]="option.value">
            {{ option.label }}
          </button>
        }
      </hlm-toggle-group>
      @if (state().touched()) {
        @for (error of state().errors(); track error.kind) {
          <hlm-field-error forceShow>{{ error | errorMessage }}</hlm-field-error>
        }
      }
    </div>
  `,
})
export class AppToggleGroup<T extends string> {
  label = input.required<string>();
  field = input.required<FieldTree<T | ''>>();
  options = input.required<SelectOption<T>[]>();

  state = computed(() => this.field()());
}
