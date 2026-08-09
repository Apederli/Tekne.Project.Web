import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { HlmButton } from '@ui/button';
import { BoatOutputModel, sortBoatPhotos } from '@models';
import { BoatService, HarborService } from '@services';
import { PhotoGallery } from '../../../../shared/photo-gallery/photo-gallery';
import { BOAT_EDIT_TABS, ROUTE_MARKET, ROUTE_PARTNER } from '../../../../core/routes.const';
import { formatBoatLocation } from '../../../../core/util/boat-location';
import { makeBoatSlug } from '../../../../core/util/boat-slug';

@Component({
  selector: 'app-my-boats',
  imports: [RouterLink, HlmButton, PhotoGallery],
  templateUrl: './my-boats.html',
})
export class MyBoats {
  boatService = inject(BoatService);
  harborService = inject(HarborService);

  newBoatUrl = [
    '/',
    ROUTE_PARTNER.main,
    ROUTE_PARTNER.dashboard,
    ROUTE_PARTNER.boats,
    ROUTE_PARTNER.boatNew,
  ];

  /** Kartın birincil hedefi — `/partner/dashboard/teknelerim/{id}/duzenle`. */
  editUrl(boatId: number): (string | number)[] {
    return [
      '/',
      ROUTE_PARTNER.main,
      ROUTE_PARTNER.dashboard,
      ROUTE_PARTNER.boats,
      boatId,
      ROUTE_PARTNER.boatEdit,
    ];
  }

  /** Marketteki herkese açık ilan — yalnızca yayındaki teknelerde gösterilir. */
  publicUrl(boat: BoatOutputModel): string[] {
    return ['/', ROUTE_MARKET.boatDetail, makeBoatSlug(boat.name, boat.id)];
  }

  boatsResource = rxResource({ stream: () => this.boatService.getMine() });
  citiesResource = rxResource({ stream: () => this.harborService.getAll() });

  loading = computed(() => this.boatsResource.isLoading());
  failed = computed(() => this.boatsResource.status() === 'error');

  /** Oturumdaki partner'ın ilanları — süzme backend'de, `GET /Boats/mine`. */
  boats = computed(() => (this.boatsResource.hasValue() ? this.boatsResource.value() : []));

  cities = computed(() => (this.citiesResource.hasValue() ? this.citiesResource.value() : []));

  tabs = BOAT_EDIT_TABS;

  /** Galeri sıralı URL listesi ister — kapak kuralı `sortBoatPhotos` ile ortak. */
  photoUrls(boat: BoatOutputModel): string[] {
    return sortBoatPhotos(boat.photos).map((p) => p.url);
  }

  /** Listede gösterilen konum: bağlı olduğu limanın adı, yanında şehir. */
  location(boat: BoatOutputModel): string {
    return formatBoatLocation(boat, this.cities(), '—');
  }

  /**
   * Swiper nokta/sürükleme tıklamasında preventDefault ediyor ama propagation'ı
   * durdurmuyor; RouterLink ise defaultPrevented'a bakmıyor. Burada kesilmezse
   * karttaki noktaya dokunmak düzenleme sayfasına götürürdü.
   */
  swallowSwiperClick(event: Event): void {
    if (event.defaultPrevented) event.stopPropagation();
  }
}
