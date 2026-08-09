import { Directive, input } from '@angular/core';
import { BrnToggle } from '@spartan-ng/brain/toggle';
import { classes } from '@ui/utils';
import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Seçili durum, temanın "pastel dolgu + koyu yazı" kalıbından bilinçli sapar:
 * pastel `--primary` üstünde beyaz yazı 2.1:1'de kalıyor, koyu yazıyla da
 * (8.1:1) yeşil-siyah kontrastı görsel olarak istenmedi. `--primary-deep`
 * dolgusu beyaz yazıyla 4.6:1 veriyor. Hover açmaz — /90 karışımı 3.4:1'e
 * düşüyordu; seçili öğe hover'da aynı tonda kalır.
 *
 * Seçili olmayanların yazısı `muted-foreground` (beyaz zeminde 4.73:1) —
 * seçili olanın öne çıkması için bilinçli soluk; hover'da `foreground`'a döner.
 */
export const toggleVariants = cva(
  "text-muted-foreground hover:text-foreground aria-pressed:bg-primary-deep aria-pressed:text-white focus-visible:border-ring focus-visible:ring-ring/50 data-[matches-spartan-invalid=true]:ring-destructive/20 dark:data-[matches-spartan-invalid=true]:ring-destructive/40 data-[matches-spartan-invalid=true]:border-destructive data-[state=on]:bg-primary-deep data-[state=on]:text-white data-[state=on]:hover:bg-primary-deep data-[state=on]:hover:text-white gap-1 rounded-lg text-sm font-medium transition-all [&_ng-icon:not([class*='text-'])]:text-[length:--spacing(4)] group/toggle hover:bg-muted inline-flex cursor-pointer items-center justify-center whitespace-nowrap outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_ng-icon]:pointer-events-none [&_ng-icon]:shrink-0",
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        outline: 'border-input hover:bg-muted border bg-transparent',
      },
      size: {
        default: 'h-8 min-w-8 px-2.5',
        sm: "h-7 min-w-7 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] [&_ng-icon:not([class*='text-'])]:text-[length:--spacing(3.5)]",
        lg: 'h-9 min-w-9 px-2.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);
export type ToggleVariants = VariantProps<typeof toggleVariants>;

@Directive({
  selector: 'button[hlmToggle]',
  hostDirectives: [
    {
      directive: BrnToggle,
      inputs: ['id', 'value', 'disabled', 'state', 'aria-label', 'type'],
      outputs: ['stateChange'],
    },
  ],
  host: {
    'data-slot': 'toggle',
  },
})
export class HlmToggle {
  public readonly variant = input<ToggleVariants['variant']>('default');
  public readonly size = input<ToggleVariants['size']>('default');
  constructor() {
    classes(() =>
      toggleVariants({
        variant: this.variant(),
        size: this.size(),
      }),
    );
  }
}
