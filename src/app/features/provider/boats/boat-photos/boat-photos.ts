import { Component, computed, inject, linkedSignal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { BoatService } from '@services';
import { PhotoUploader } from '../photo-uploader/photo-uploader';

/**
 * Düzenleme sayfasının "Fotoğraflar" sekmesi — `PhotoUploader`'ın host'u.
 *
 * Uploader veri çekmediği için tekneyi buradan yüklüyoruz; `photosChanged`
 * geldiğinde listeyi yeniden çekmek yerine `photos.set` ile yazıyoruz — refetch,
 * uploader'ın `photos()` girdisinin bayat kaldığı pencereyi bir gidiş-dönüş
 * boyunca açık tutardı.
 */
@Component({
  selector: 'app-boat-photos',
  imports: [PhotoUploader],
  templateUrl: './boat-photos.html',
})
export class BoatPhotos {
  route = inject(ActivatedRoute);
  boatService = inject(BoatService);

  /**
   * Sekme olduğu için route paramı input'a bağlanmıyor; kapsayıcının
   * route'undan okunur (`withComponentInputBinding` yalnızca route'a bağlı
   * bileşenlere işler).
   */
  boatId = toSignal(this.route.paramMap.pipe(map((p) => p.get('boatId'))), {
    initialValue: null,
  });

  boatResource = rxResource({
    params: () => {
      const id = this.boatId();
      return id ? Number(id) : undefined;
    },
    stream: ({ params }) => this.boatService.getById(params),
  });

  loading = computed(() => this.boatResource.isLoading());
  failed = computed(() => this.boatResource.status() === 'error');

  boat = computed(() => (this.boatResource.hasValue() ? this.boatResource.value() : null));

  /**
   * Uploader'a giden liste. `linkedSignal`: tekne yeniden yüklenirse sunucudan
   * gelen listeye döner, aradaki `photosChanged` emitleri ise `set` ile üzerine
   * yazılır — gerçek listenin sahibi bu sekmedir.
   */
  photos = linkedSignal(() => this.boat()?.photos ?? []);
}
