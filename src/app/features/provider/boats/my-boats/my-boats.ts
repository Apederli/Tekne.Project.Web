import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { HlmButton } from '@ui/button';
import { HlmTableImports } from '@ui/table';
import { BoatType, RentalType } from '@enums';
import { BoatOutputModel, CityHarborsOutputModel } from '@models';
import { BoatService, HarborService } from '@services';
import { PhotoGallery } from '../../../../shared/photo-gallery/photo-gallery';
import { ROUTE_PARTNER } from '../../../../core/routes.const';

const BOAT_TYPE_LABELS: Record<BoatType, string> = {
  [BoatType.Sailboat]: 'Yelkenli',
  [BoatType.MotorYacht]: 'Motor yat',
  [BoatType.Catamaran]: 'Katamaran',
  [BoatType.Gulet]: 'Gulet',
};

const RENTAL_TYPE_LABELS: Record<RentalType, string> = {
  [RentalType.Hourly]: 'Saatlik',
  [RentalType.Daily]: 'Günlük',
};

@Component({
  selector: 'app-my-boats',
  imports: [RouterLink, HlmButton, HlmTableImports, PhotoGallery],
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

  boatsResource = rxResource({ stream: () => this.boatService.getMine() });
  citiesResource = rxResource({ stream: () => this.harborService.getAll() });

  loading = computed(() => this.boatsResource.isLoading());
  failed = computed(() => this.boatsResource.status() === 'error');

  /** Oturumdaki partner'ın ilanları — süzme backend'de, `GET /Boats/mine`. */
  boats = computed(() =>
    this.boatsResource.hasValue() ? this.boatsResource.value() : [],
  );

  cities = computed(() =>
    this.citiesResource.hasValue() ? this.citiesResource.value() : [],
  );

  boatTypeLabel(type: BoatType): string {
    return BOAT_TYPE_LABELS[type] ?? type;
  }

  rentalTypeLabel(type: RentalType): string {
    return RENTAL_TYPE_LABELS[type] ?? type;
  }

  /** Listede gösterilen konum: bağlı olduğu limanın adı, yanında şehir. */
  location(boat: BoatOutputModel): string {
    const city = this.cities().find((c) => c.cityId === boat.cityId);
    const harbor = harborName(city, boat.primaryHarborId);
    if (!city) return harbor ?? '—';
    return harbor ? `${harbor}, ${city.cityName}` : city.cityName;
  }
}

function harborName(
  city: CityHarborsOutputModel | undefined,
  harborId: number,
): string | undefined {
  return city?.harbors.find((h) => h.id === harborId)?.name;
}
