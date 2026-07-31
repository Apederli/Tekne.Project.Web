import {
  afterNextRender,
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  input,
} from '@angular/core';
import type { ClassValue } from 'clsx';
import { register } from 'swiper/element/bundle';
import { BoatPhotoOutputModel, sortBoatPhotos } from '@models';
import { PhotoUrlService } from '@services';

/**
 * Fotoğraf galerisi — Swiper Element (web component) üzerine kurulu.
 *
 * `shared/` altında duruyor çünkü iki erişim alanı da kullanıyor: partner kendi
 * ilanlarını, market ziyaretçiye gösterirken. Alan bilgisi taşımıyor; ilana özel
 * her şey (rezervasyon butonu, durum etiketi) `ng-content` ile dışarıdan gelir.
 *
 * Tasarım referansı teknevia kartı: fotoğraf 300×240 (5:4), gezinme yalnızca
 * kaydırma + dinamik nokta sayfalama — ok düğmesi yok.
 */
@Component({
  selector: 'app-photo-gallery',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './photo-gallery.html',
})
export class PhotoGallery {
  photoUrl = inject(PhotoUrlService);

  photos = input.required<BoatPhotoOutputModel[]>();

  /** Tekne adı — alt metni bundan üretiliyor ("Ayla fotoğraf 2 / 8"). */
  alt = input('');

  /** Düzeni çağıran belirler; oran/köşe burada override edilir. 5:4 = teknevia kartı. */
  galleryClass = input<ClassValue>('aspect-[5/4]', { alias: 'class' });

  /** Sıra `PhotoUploader` ile ortak (`sortBoatPhotos`) — iki ekran aynı fotoğrafı kapak saysın. */
  visible = computed(() => sortBoatPhotos(this.photos()));

  /** Nokta ve rewind tek fotoğrafta anlamsız — hiç render edilmiyor. */
  scrollable = computed(() => this.visible().length > 1);

  constructor() {
    // `customElements` sunucuda yok; Swiper'ın `register`'ı zaten tanımlıysa atlar,
    // bileşen başına çağrı güvenli.
    afterNextRender(() => register());
  }

  photoAlt(index: number): string {
    const position = `fotoğraf ${index + 1} / ${this.visible().length}`;
    const name = this.alt().trim();
    return name ? `${name} — ${position}` : position;
  }
}
