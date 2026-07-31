import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { BoatOutputModel } from '@models';
import { BoatService, HarborService } from '@services';
import { formatBoatLocation } from '../../../core/util/boat-location';
import { BoatCard } from './boat-card';

/**
 * Tekne arama/listeleme sayfası. Filtreler henüz yok; şimdilik tüm ilanlar
 * kart ızgarasında listeleniyor — kart üzerindeki rozet/kalp overlay'inin
 * gerçek veriyle görülebildiği ilk müşteri ekranı.
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
  harborService = inject(HarborService);

  boatsResource = rxResource({ stream: () => this.boatService.getList() });
  citiesResource = rxResource({ stream: () => this.harborService.getAll() });

  loading = computed(() => this.boatsResource.isLoading());

  boats = computed(() => (this.boatsResource.hasValue() ? this.boatsResource.value() : []));

  cities = computed(() => (this.citiesResource.hasValue() ? this.citiesResource.value() : []));

  /** Bağlı liman + şehir — `MyBoats.location` ile aynı kural (ana liman gösterilir). */
  location(boat: BoatOutputModel): string {
    return formatBoatLocation(boat, this.cities());
  }
}
