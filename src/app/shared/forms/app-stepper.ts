import { booleanAttribute, Component, computed, input } from '@angular/core';
import { FieldTree } from '@angular/forms/signals';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMinus, lucidePlus } from '@ng-icons/lucide';
import { HlmButton } from '@ui/button';
import { HlmFieldImports } from '@ui/field';

let nextId = 0;

@Component({
  selector: 'app-stepper',
  imports: [HlmButton, HlmFieldImports, NgIcon],
  viewProviders: [provideIcons({ lucideMinus, lucidePlus })],
  template: `
    <div hlmField>
      <label hlmFieldLabel [for]="valueId()" [class.justify-center]="centered()">
        {{ label() }}
      </label>
      <div class="flex items-center gap-3" [class.justify-center]="centered()">
        <!-- size-11 = 44px: dokunma hedefi. -->
        <button
          hlmBtn
          type="button"
          variant="outline"
          size="icon"
          class="size-11 rounded-full"
          [disabled]="disabled() || !canDecrease()"
          [attr.aria-label]="label() + ' azalt'"
          (click)="step(-1)"
        >
          <ng-icon name="lucideMinus" />
        </button>

        <output [id]="valueId()" class="min-w-28 text-center text-sm" aria-live="polite">
          {{ display() }}
        </output>

        <button
          hlmBtn
          type="button"
          variant="outline"
          size="icon"
          class="size-11 rounded-full"
          [disabled]="disabled() || !canIncrease()"
          [attr.aria-label]="label() + ' artır'"
          (click)="step(1)"
        >
          <ng-icon name="lucidePlus" />
        </button>
      </div>
    </div>
  `,
})
export class AppStepper {
  label = input.required<string>();

  field = input.required<FieldTree<number | null>>();

  min = input(1);

  max = input(Number.MAX_SAFE_INTEGER);

  /** Değerin yanında görünen birim: "saat", "kişi". */
  unit = input('');

  /** Alan boşken gösterilen metin. */
  placeholder = input('Seçilmedi');

  centered = input(false, { transform: booleanAttribute });

  valueId = input(`app-stepper-${nextId++}`);

  state = computed(() => this.field()());

  /** Alan `disabled()` işaretliyse (zincir kuralı) düğmeler gerçekten kilitlenir. */
  disabled = computed(() => this.state().disabled());

  value = computed(() => this.state().value());

  display = computed(() => {
    const value = this.value();
    return value === null ? this.placeholder() : `${value} ${this.unit()}`.trim();
  });

  canDecrease = computed(() => {
    const value = this.value();
    return !this.disabled() && value !== null && value > this.min();
  });

  canIncrease = computed(() => {
    const value = this.value();
    return !this.disabled() && (value === null || value < this.max());
  });

  /** Boş alanda ilk dokunuş `min`'e oturur; artı da eksi de oradan başlar. */
  step(delta: number): void {
    if (this.disabled()) return;
    const value = this.value();
    const next = value === null ? this.min() : value + delta;
    this.state().value.set(Math.min(Math.max(next, this.min()), this.max()));
  }
}
