import { Service, computed, signal } from '@angular/core';

/**
 * Uçan HTTP isteği sayacının tek sahibi. Artırma/azaltma yalnızca
 * `pendingRequestsInterceptor`'dan gelir; bileşenler sadece `pending` okur.
 */
@Service()
export class PendingRequests {
  count = signal(0);

  pending = computed(() => this.count() > 0);

  increment(): void {
    this.count.update((n) => n + 1);
  }

  decrement(): void {
    this.count.update((n) => n - 1);
  }
}
