import {
  afterNextRender,
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  output,
} from '@angular/core';
import type { ClassValue } from 'clsx';
import { register } from 'swiper/element/bundle';

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
  /**
   * Fotoğrafların tam URL listesi — gösterim sırasında, kapak ilk eleman.
   * Sıralama çağıranın sözleşmesi: kart ucu backend'den sıralı gelir, tam
   * modelli ekranlar `sortBoatPhotos(...).map(p => p.url)` ile üretir.
   */
  photos = input.required<string[]>();

  /** Tekne adı — alt metni bundan üretiliyor ("Ayla fotoğraf 2 / 8"). */
  alt = input('');

  /** true iken slaytlar butona dönüşür; tıklanan index `photoOpened`'dan çıkar. */
  interactive = input(false);

  /** Tıklanan slaytın `visible()` içindeki index'i — lightbox açılış slaytı. */
  photoOpened = output<number>();

  /** Düzeni çağıran belirler; oran/köşe burada override edilir. 5:4 = teknevia kartı. */
  galleryClass = input<ClassValue>('aspect-[5/4]', { alias: 'class' });

  /** Nokta ve rewind tek fotoğrafta anlamsız — hiç render edilmiyor. */
  scrollable = computed(() => this.photos().length > 1);

  constructor() {
    // `customElements` sunucuda yok; Swiper'ın `register`'ı zaten tanımlıysa atlar,
    // bileşen başına çağrı güvenli.
    afterNextRender(() => register());
  }

  photoAlt(index: number): string {
    const position = `fotoğraf ${index + 1} / ${this.photos().length}`;
    const name = this.alt().trim();
    return name ? `${name} — ${position}` : position;
  }
}
