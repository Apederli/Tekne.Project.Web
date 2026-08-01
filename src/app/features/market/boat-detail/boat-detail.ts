import { Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { rxResource } from '@angular/core/rxjs-interop';
import { sortBoatPhotos } from '@models';
import { BoatService, HarborService, PhotoUrlService } from '@services';
import { PhotoGallery } from '../../../shared/photo-gallery/photo-gallery';
import { PhotoLightboxService } from '../../../shared/photo-lightbox/photo-lightbox.service';
import { BOAT_TYPE_LABELS } from '../../../core/util/boat-labels';
import { formatBoatLocation } from '../../../core/util/boat-location';
import { parseBoatIdFromSlug } from '../../../core/util/boat-slug';
import { ROUTE_MARKET } from '../../../core/routes.const';

/**
 * Herkese açık tekne detayı. Masaüstünde foto mozaiği, mobilde kaydırmalı
 * galeri — geçiş saf CSS, iki blok da DOM'da (hydration riski yok).
 */
@Component({
  selector: 'app-boat-detail',
  imports: [RouterLink, PhotoGallery],
  templateUrl: './boat-detail.html',
})
export class BoatDetail {
  boatService = inject(BoatService);
  harborService = inject(HarborService);
  photoUrl = inject(PhotoUrlService);
  lightbox = inject(PhotoLightboxService);
  title = inject(Title);

  /** `withComponentInputBinding` route parametresini doğrudan bağlar. */
  slug = input.required<string>();

  boatsUrl = ['/', ROUTE_MARKET.boats];

  /** Slug'un yalnızca sondaki id kısmı anlamlı — ad kısmı doğrulanmaz. */
  boatId = computed(() => parseBoatIdFromSlug(this.slug()));

  // `?? undefined`: id çözülemezse resource hiç istek açmaz (params undefined = bekle).
  boatResource = rxResource({
    params: () => this.boatId() ?? undefined,
    stream: ({ params }) => this.boatService.getById(params),
  });

  citiesResource = rxResource({ stream: () => this.harborService.getAll() });

  // notFound şablonda önce kontrol ediliyor; id null iken loading'in ayrıca
  // bunu tekrar etmesine gerek yok.
  loading = computed(() => this.boatResource.isLoading());
  notFound = computed(() => this.boatId() === null || this.boatResource.status() === 'error');

  boat = computed(() => (this.boatResource.hasValue() ? this.boatResource.value() : null));

  /** Sıra her yerdeki gibi `sortBoatPhotos` — kapak başta. */
  photos = computed(() => sortBoatPhotos(this.boat()?.photos ?? []));

  cover = computed(() => this.photos()[0]);
  tiles = computed(() => this.photos().slice(1, 5));
  /** Mozaikte görünmeyen fotoğraf sayısı — "+N fotoğraf" çipi. */
  extraCount = computed(() => Math.max(0, this.photos().length - 5));

  /**
   * Kapak, döşeme sayısına göre büyür: döşeme yoksa ızgaranın tamamını kaplar,
   * varsa hep sol yarıyı. "Boş hücre gösterilmez" kuralı — Tailwind sınıfları
   * derleme zamanında taranıyor, parça birleştirme göremiyor, bu yüzden her
   * durum tam literal string olarak yazılmalı. Görsel sınıflar şablondaki
   * `img`'da; burası yalnızca grid konumu (grid çocuğu artık buton).
   */
  coverClass = computed(() =>
    this.tiles().length === 0 ? 'col-span-4 row-span-2' : 'col-span-2 row-span-2',
  );

  /** index: `photos()` (sıralı) içindeki konum — kapak 0, karolar i+1, çip 5. */
  openLightbox(index: number): void {
    const b = this.boat();
    if (!b) return;
    this.lightbox.open(this.photos(), index, b.name);
  }

  /**
   * Sağ yarıdaki döşemelerin yerleşimi döşeme sayısına göre değişir ki boş
   * hücre kalmasın (1-4 arası fotoğrafta sabit 2x2 boşluk bırakırdı). Aynı
   * Tailwind kısıtı: sınıflar burada da tam literal olmalı.
   */
  tileClass(index: number): string {
    const count = this.tiles().length;
    if (count === 1) return 'relative col-span-2 row-span-2';
    if (count === 2) return 'relative col-span-2';
    if (count === 3) return index === 0 ? 'relative col-span-2' : 'relative col-span-1';
    return 'relative col-span-1';
  }

  cities = computed(() => (this.citiesResource.hasValue() ? this.citiesResource.value() : []));

  /** "Bodrum Limanı, Muğla" — MyBoats.location kuralının aynısı. */
  location = computed(() => {
    const b = this.boat();
    return b ? formatBoatLocation(b, this.cities()) : '';
  });

  typeLabel = computed(() => {
    const b = this.boat();
    // Bilinmeyen enum değeri sessizce "undefined" basmasın diye ham değere düş.
    return b ? (BOAT_TYPE_LABELS[b.boatType] ?? b.boatType) : '';
  });

  constructor() {
    // SEO: başlık tekne adına çekilir; Title servisi SSR'da da çalışır.
    effect(() => {
      const b = this.boat();
      if (b) this.title.setTitle(`${b.name} — Tekne`);
    });
  }
}
