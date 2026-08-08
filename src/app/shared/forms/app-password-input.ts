import { booleanAttribute, Component, computed, input, signal } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEye, lucideEyeOff, lucideLock } from '@ng-icons/lucide';
import { HlmFieldImports } from '@ui/field';
import { HlmInputGroupImports } from '@ui/input-group';
import { ErrorMessagePipe } from './error-message-pipe';

/**
 * Signal Forms'a bağlı şifre girişi: sağda göster/gizle butonu, `icon`
 * verilirse solda kilit ikonu. `app-input`'tan ayrıldı çünkü göster/gizle
 * durumu ve göz ikonları yalnız şifrede anlamlı — `app-phone-input` ile
 * aynı gerekçe: davranışı olan varyant kendi bileşenine çıkar.
 *
 * `autocomplete` girişte `current-password` (login) / kayıt formunda
 * `new-password` olmalı; tarayıcının şifre önerisi buna bakar.
 */
@Component({
  selector: 'app-password-input',
  imports: [ErrorMessagePipe, FormField, HlmFieldImports, HlmInputGroupImports, NgIcon],
  viewProviders: [provideIcons({ lucideEye, lucideEyeOff, lucideLock })],
  template: `
    <div hlmField>
      <label hlmFieldLabel [class.sr-only]="hideLabel()">
        {{ label() }}
      </label>
      <div hlmInputGroup [class]="groupClass()">
        @if (icon()) {
          <hlm-input-group-addon><ng-icon name="lucideLock" /></hlm-input-group-addon>
        }
        <input
          hlmInputGroupInput
          [type]="revealed() ? 'text' : 'password'"
          [attr.autocomplete]="autocomplete()"
          [attr.placeholder]="placeholder()"
          [formField]="field()"
        />
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
      </div>
      @if (state().touched()) {
        @for (error of state().errors(); track error.kind) {
          <hlm-field-error forceShow>{{ error | errorMessage }}</hlm-field-error>
        }
      }
    </div>
  `,
})
export class AppPasswordInput {
  label = input.required<string>();

  field = input.required<FieldTree<string>>();

  autocomplete = input<'current-password' | 'new-password'>('current-password');

  placeholder = input<string>();

  /**
   * Etiketi yalnız görsel olarak gizler (`sr-only`) — ekran okuyucu için
   * kalır. Placeholder'lı kompakt formlarda (giriş/kayıt modalı) kullanılır.
   */
  hideLabel = input(false, { transform: booleanAttribute });

  /** Solda kilit ikonu gösterir. */
  icon = input(false, { transform: booleanAttribute });

  /**
   * `lg`: giriş/kayıt modalındaki büyük görünüm — 56px, tam yuvarlak hat,
   * masaüstünde de `text-base`. Varsayılan boy formların geri kalanında.
   */
  size = input<'default' | 'lg'>('default');

  revealed = signal(false);

  groupClass = computed(() =>
    this.size() === 'lg'
      ? 'h-14 rounded-2xl [&>[data-align=inline-start]]:ps-4 [&>[data-align=inline-end]]:pe-3 ' +
        '[&_ng-icon]:text-[length:--spacing(5.5)] *:data-[slot=input-group-control]:md:text-base'
      : '',
  );

  state = computed(() => this.field()());
}
