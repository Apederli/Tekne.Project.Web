import { afterNextRender, Component, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';
import { register } from 'swiper/element/bundle';
import type { Swiper } from 'swiper/types';
import { PhotoLightboxData, sortBoatPhotos } from '@models';

/**
 * Tam ekran fotoğraf görüntüleyici. Tek başına kullanılmaz —
 * `PhotoLightboxService.open` CDK Dialog ile açar, bağlam `DIALOG_DATA`'dan gelir.
 *
 * Satır içi `PhotoGallery`'den bilinçli ayrı: o kart için tasarlandı
 * (kırpma + noktalar), buranın varlık sebebi kırpmadan göstermek
 * (`object-contain`) ve nokta yerine "3 / 12" sayacı.
 *
 * Host `fixed inset-0`: CDK'nın pane/container boyutlarına bağımlılık yok,
 * panel her durumda ekranı kaplar. Escape ve odak yönetimi CDK'da.
 */
@Component({
  selector: 'app-photo-lightbox',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [NgIcon],
  providers: [provideIcons({ lucideX })],
  templateUrl: './photo-lightbox.html',
  host: { class: 'fixed inset-0 z-10 block bg-black' },
})
export class PhotoLightbox {
  ref = inject<DialogRef<void>>(DialogRef);
  data = inject<PhotoLightboxData>(DIALOG_DATA);

  /** Sıra her yerdeki gibi `sortBoatPhotos` — tetikleyen index'ler bu sırayla üretildi. */
  photos = sortBoatPhotos(this.data.photos);

  /** Sayaç için aktif slayt — `swiperslidechange` olayından güncellenir. */
  current = signal(this.data.startIndex);

  scrollable = this.photos.length > 1;

  constructor() {
    // `customElements` sunucuda yok; `register` tanımlıysa atlar (PhotoGallery deseni).
    afterNextRender(() => register());
  }

  onSlideChange(event: Event): void {
    const [swiper] = (event as CustomEvent<[Swiper]>).detail;
    this.current.set(swiper.activeIndex);
  }

  photoAlt(index: number): string {
    const position = `fotoğraf ${index + 1} / ${this.photos.length}`;
    const name = this.data.alt.trim();
    return name ? `${name} — ${position}` : position;
  }
}
