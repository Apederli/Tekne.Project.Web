import { booleanAttribute, Component, computed, input } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMail, lucidePhone, lucideUser } from '@ng-icons/lucide';
import { HlmFieldImports } from '@ui/field';
import { HlmInputGroupImports } from '@ui/input-group';

/**
 * `icon` girdisinin kabul ettiği kısa adlar → lucide ikon adları.
 * Yeni ikon gerektiğinde buraya eklenir; `provideIcons` da güncellenmeli.
 */
const ICON_MAP = {
  user: 'lucideUser',
  mail: 'lucideMail',
  phone: 'lucidePhone',
} as const;

export type AppInputIcon = keyof typeof ICON_MAP;

@Component({
  selector: 'app-input',
  imports: [FormField, HlmFieldImports, HlmInputGroupImports, NgIcon],
  viewProviders: [provideIcons({ lucideMail, lucidePhone, lucideUser })],
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
          [type]="type()"
          [attr.step]="step()"
          [attr.autocomplete]="autocomplete()"
          [attr.placeholder]="placeholder()"
          [formField]="field()"
        />
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


  field = input.required<FieldTree<string | number | null>>();

  type = input<'text' | 'number' | 'email' | 'tel'>('text');

  step = input<string>();

  autocomplete = input<string>();
  optional = input(false, { transform: booleanAttribute });
  placeholder = input<string>();

  hideLabel = input(false, { transform: booleanAttribute });

  icon = input<AppInputIcon>();

  size = input<'default' | 'lg'>('default');

  iconName = computed(() => {
    const icon = this.icon();
    return icon ? ICON_MAP[icon] : undefined;
  });

  groupClass = computed(() =>
    this.size() === 'lg'
      ? 'h-14 rounded-2xl [&>[data-align=inline-start]]:ps-4 [&>[data-align=inline-end]]:pe-3 ' +
        '[&_ng-icon]:text-[length:--spacing(5.5)] *:data-[slot=input-group-control]:md:text-base'
      : '',
  );

  state = computed(() => this.field()());
}
