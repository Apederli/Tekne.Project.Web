import { Component, input, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideHeart } from '@ng-icons/lucide';
import { BoatOutputModel } from '@models';
import { PhotoGallery } from '../../../shared/photo-gallery/photo-gallery';

/**
 * Market tekne kartı — teknevia kartı referans: üstte fotoğraf galerisi,
 * galerinin üzerinde anında rezervasyon rozeti ve favori kalbi, altta künye.
 *
 * Rozet ve kalp galeriye `ng-content` ile projekte ediliyor; galeri alan
 * bilgisi taşımıyor, overlay tamamen bu kartın malı.
 */
@Component({
  selector: 'app-boat-card',
  imports: [NgIcon, PhotoGallery],
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

  toggleFavorite(): void {
    this.favorite.update((f) => !f);
  }
}
