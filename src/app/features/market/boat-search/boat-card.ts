import { Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideHeart } from '@ng-icons/lucide';
import { BoatOutputModel } from '@models';
import { PhotoGallery } from '../../../shared/photo-gallery/photo-gallery';
import { makeBoatSlug } from '../../../core/util/boat-slug';
import { ROUTE_MARKET } from '../../../core/routes.const';

/**
 * Market tekne kartı — teknevia kartı referans: üstte fotoğraf galerisi,
 * galerinin üzerinde anında rezervasyon rozeti ve favori kalbi, altta künye.
 *
 * Rozet ve kalp galerinin KARDEŞİ olarak, aynı bağıl konumlu kapsayıcı
 * içinde dursun diye ayrı bir overlay div'inde duruyor — galeriye ng-content
 * ile bir şey projekte edilmiyor, galeri alan bilgisi taşımıyor.
 */
@Component({
  selector: 'app-boat-card',
  imports: [NgIcon, PhotoGallery, RouterLink],
  providers: [provideIcons({ lucideHeart })],
  templateUrl: './boat-card.html',
})
export class BoatCard {
  boat = input.required<BoatOutputModel>();

  /** "Bodrum Limanı, Muğla" — kartı çağıran sayfa üretir, kart konum hiyerarşisini bilmez. */
  location = input('');

  /**
   * TODO(backend): favori uçları henüz yok — durum sayfa ömürlük, yalnızca
   * görsel test için. Kalıcılık geldiğinde bir FavoriteService'e taşınacak.
   */
  favorite = signal(false);

  detailUrl = computed(() => [
    '/',
    ROUTE_MARKET.boatDetail,
    makeBoatSlug(this.boat().name, this.boat().id),
  ]);

  /** Linkin erişilebilir adı — slaytların alt metinleriyle kirlenmesin diye açıkça verildi. */
  cardLabel = computed(() =>
    this.location() ? this.boat().name + ' — ' + this.location() : this.boat().name,
  );

  /**
   * Swiper nokta/sürükleme tıklamasında preventDefault ediyor ama propagation'ı
   * durdurmuyor; RouterLink ise defaultPrevented'a bakmıyor. Burada kesilmezse
   * karttaki noktaya dokunmak detaya götürürdü.
   */
  swallowSwiperClick(event: Event): void {
    if (event.defaultPrevented) event.stopPropagation();
  }

  /**
   * Kalp, linkin KARDEŞİ olarak overlay içinde — linkin içine nested buton geçersiz HTML olurdu
   * ve ekran okuyucunun linkin adını kalp metniyle kirletirdi. Kapsayıcı pointer-events-none,
   * düğme pointer-events-auto, bu yüzden rozet tıklaması linke geçer, kalp tıklaması burada kalır.
   */
  toggleFavorite(): void {
    this.favorite.update((f) => !f);
  }
}
