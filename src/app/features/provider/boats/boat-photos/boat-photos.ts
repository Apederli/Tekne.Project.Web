import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { HlmButton } from '@ui/button';
import { BoatService } from '@services';
import { PhotoUploader } from '../photo-uploader/photo-uploader';
import { ROUTE_PARTNER } from '../../../../core/routes.const';

/**
 * Tek teknenin fotoğraf yönetimi sayfası — `PhotoUploader`'ın host'u.
 *
 * Uploader veri çekmediği için tekneyi buradan yüklüyoruz; `photosChanged`
 * geldiğinde listeyi yeniden çekmek yerine `photos.set` ile yazıyoruz — refetch,
 * uploader'ın `photos()` girdisinin bayat kaldığı pencereyi bir gidiş-dönüş
 * boyunca açık tutardı.
 */
@Component({
  selector: 'app-boat-photos',
  imports: [RouterLink, HlmButton, PhotoUploader],
  templateUrl: './boat-photos.html',
})
export class BoatPhotos {
  boatService = inject(BoatService);

  /** Route paramı — `withComponentInputBinding` string olarak bağlar. */
  boatId = input.required<string>();

  /** Geri dönüş linki — teknelerim listesi. */
  boatsUrl = ['/', ROUTE_PARTNER.main, ROUTE_PARTNER.dashboard, ROUTE_PARTNER.boats];

  boatResource = rxResource({
    params: () => Number(this.boatId()),
    stream: ({ params }) => this.boatService.getById(params),
  });

  loading = computed(() => this.boatResource.isLoading());
  failed = computed(() => this.boatResource.status() === 'error');

  boat = computed(() => (this.boatResource.hasValue() ? this.boatResource.value() : null));

  /**
   * Uploader'a giden liste. `linkedSignal`: tekne yeniden yüklenirse sunucudan
   * gelen listeye döner, aradaki `photosChanged` emitleri ise `set` ile üzerine
   * yazılır — gerçek listenin sahibi bu sayfadır.
   */
  photos = linkedSignal(() => this.boat()?.photos ?? []);
}
