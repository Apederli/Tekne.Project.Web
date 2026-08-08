import { computed, Directive, effect, input, untracked } from '@angular/core';
import { injectCustomClassSettable } from '@spartan-ng/brain/core';
import { BrnDialogOverlay } from '@spartan-ng/brain/dialog';
import { hlm } from '@ui/utils';
import type { ClassValue } from 'clsx';

/* Perde tamamen şeffaf (ürün kararı): karartma ve blur yok, arkadaki sayfa
   olduğu gibi görünür. Eleman yine de tıklamayı yutar ve dışarı-tıkla-kapat
   davranışını taşır. */
export const hlmDialogOverlayClass = hlm('isolate');

@Directive({
  selector: '[hlmDialogOverlay],hlm-dialog-overlay',
  hostDirectives: [BrnDialogOverlay],
})
export class HlmDialogOverlay {
  private readonly _classSettable = injectCustomClassSettable({ optional: true, host: true });

  public readonly userClass = input<ClassValue>('', { alias: 'class' });
  protected readonly _computedClass = computed(() => hlm(hlmDialogOverlayClass, this.userClass()));

  constructor() {
    effect(() => {
      const newClass = this._computedClass();
      untracked(() => this._classSettable?.setClassToCustomElement(newClass));
    });
  }
}
