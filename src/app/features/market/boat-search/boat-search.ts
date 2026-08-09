import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { BoatCardOutputModel } from '@models';
import { BoatService } from '@services';
import { BoatCard } from './boat-card';

/**
 * Tekne arama/listeleme sayfası. Filtreler henüz yok; şimdilik tüm ilanlar
 * kart ızgarasında listeleniyor. Konum adları backend'den hazır gelir —
 * sayfa şehir/liman lookup'ı yapmaz.
 */
@Component({
  selector: 'app-boat-search',
  imports: [BoatCard],
  template: `
    <h1 class="text-2xl font-semibold">Tekneler</h1>

    @if (loading()) {
      <p class="mt-6 text-sm text-muted-foreground">Tekneler yükleniyor…</p>
    } @else if (boats().length === 0) {
      <p class="mt-6 text-sm text-muted-foreground">Henüz listelenecek tekne yok.</p>
    } @else {
      <!-- Mobile-first: tek sütun, ekranla birlikte genişler. -->
      <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        @for (boat of boats(); track boat.id) {
          <app-boat-card [boat]="boat" [location]="location(boat)" />
        }
      </div>
    }
  `,
})
export class BoatSearch {
  boatService = inject(BoatService);

  boatsResource = rxResource({ stream: () => this.boatService.getList() });

  loading = computed(() => this.boatsResource.isLoading());

  boats = computed(() => (this.boatsResource.hasValue() ? this.boatsResource.value() : []));

  location(boat: BoatCardOutputModel): string {
    return `${boat.primaryHarborName}, ${boat.cityName}`;
  }
}
