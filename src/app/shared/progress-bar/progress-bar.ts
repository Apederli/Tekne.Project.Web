import { Component, effect, inject, signal } from '@angular/core';
import { PendingRequests } from '@services';

/**
 * Üst kenarda akan indeterminate istek göstergesi.
 *
 * 300ms gecikme: kısa isteklerde bar hiç görünmez (titreme önleme). Sayaç
 * sıfırlanınca gizlenme gecikmesiz. Sayaç yalnızca tarayıcıda arttığı için
 * SSR çıktısında bar yoktur; template'te platform dallanması gerekmez.
 */
@Component({
  selector: 'app-progress-bar',
  templateUrl: './progress-bar.html',
  styles: `
    .indicator {
      animation: progress-slide 1.2s ease-in-out infinite;
    }
    @keyframes progress-slide {
      from {
        transform: translateX(-100%);
      }
      to {
        /* w-1/3 şeridin sol kenarı 300%'te konteynerin sağ kenarına ulaşır —
           daha büyük değer, döngünün sonunda barı boş gösterirdi. */
        transform: translateX(300%);
      }
    }
  `,
})
export class ProgressBar {
  pendingRequests = inject(PendingRequests);

  visible = signal(false);
  showTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      if (this.pendingRequests.pending()) {
        if (this.showTimer === null && !this.visible()) {
          this.showTimer = setTimeout(() => {
            this.showTimer = null;
            this.visible.set(true);
          }, 300);
        }
      } else {
        if (this.showTimer !== null) {
          clearTimeout(this.showTimer);
          this.showTimer = null;
        }
        this.visible.set(false);
      }
    });
  }
}
