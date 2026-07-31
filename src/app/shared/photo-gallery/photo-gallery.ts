import { Component, computed, inject, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronLeft, lucideChevronRight } from '@ng-icons/lucide';
import type { ClassValue } from 'clsx';
import { HlmButton } from '@ui/button';
import { HlmCarouselImports } from '@ui/carousel';
import { BoatPhotoOutputModel, sortBoatPhotos } from '@models';
import { PhotoUrlService } from '@services';

/**
 * Fotoğraf galerisi — embla tabanlı `HlmCarousel` üzerine kurulu.
 *
 * `shared/` altında duruyor çünkü iki erişim alanı da kullanıyor: partner kendi
 * ilanlarını, market ziyaretçiye gösterirken. Alan bilgisi taşımıyor; ilana özel
 * her şey (rezervasyon butonu, durum etiketi) `ng-content` ile dışarıdan gelir.
 *
 * Sürükleme üç girdiyle de çalışıyor: dokunmatik ve fare embla'nın kendi pointer
 * desteğinden, klavye `HlmCarousel`'in ok tuşu dinleyicisinden.
 */
@Component({
  selector: 'app-photo-gallery',
  imports: [NgIcon, HlmButton, HlmCarouselImports],
  providers: [provideIcons({ lucideChevronLeft, lucideChevronRight })],
  templateUrl: './photo-gallery.html',
})
export class PhotoGallery {
  photoUrl = inject(PhotoUrlService);

  photos = input.required<BoatPhotoOutputModel[]>();

  /** Tekne adı — alt metni bundan üretiliyor ("Ayla fotoğraf 2 / 8"). */
  alt = input('');

  /** Düzeni çağıran belirler; oran/köşe burada override edilir. */
  galleryClass = input<ClassValue>('aspect-[4/3]', { alias: 'class' });

  /** Sıra `PhotoUploader` ile ortak (`sortBoatPhotos`) — iki ekran aynı fotoğrafı kapak saysın. */
  visible = computed(() => sortBoatPhotos(this.photos()));

  /** Ok ve sayaç tek fotoğrafta anlamsız — hiç render edilmiyor. */
  scrollable = computed(() => this.visible().length > 1);

  photoAlt(index: number): string {
    const position = `fotoğraf ${index + 1} / ${this.visible().length}`;
    const name = this.alt().trim();
    return name ? `${name} — ${position}` : position;
  }
}
