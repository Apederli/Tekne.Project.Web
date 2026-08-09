import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideHeart, lucideStar } from '@ng-icons/lucide';
import { BoatCardOutputModel } from '@models';
import { PhotoGallery } from '../../../shared/photo-gallery/photo-gallery';
import { makeBoatSlug } from '../../../core/util/boat-slug';
import { ROUTE_MARKET } from '../../../core/routes.const';
import { AuthStore } from '../../../core/auth/auth-store';
import { AuthModalService } from '../auth-modal/auth-modal.service';
import { BoatFavoriteService } from '@services';

@Component({
  selector: 'app-boat-card',
  imports: [NgIcon, PhotoGallery, RouterLink],
  providers: [provideIcons({ lucideHeart, lucideStar })],
  templateUrl: './boat-card.html',
})
export class BoatCard {
  authStore = inject(AuthStore);
  authModal = inject(AuthModalService);
  favoriteService = inject(BoatFavoriteService);

  boat = input.required<BoatCardOutputModel>();

  location = input('');

  departure = input('');

  // Sunucudan gelen durumla başlar, kart başka tekneye geçerse sıfırlanır.
  favorite = linkedSignal(() => this.boat().isFavorite);

  detailUrl = computed(() => [
    '/',
    ROUTE_MARKET.boatDetail,
    makeBoatSlug(this.boat().name, this.boat().id),
  ]);

  typeLabel = computed(() => this.boat().boatTypeLabel);

  cardLabel = computed(() =>
    this.location() ? this.typeLabel() + ' — ' + this.location() : this.typeLabel(),
  );

  swallowSwiperClick(event: Event): void {
    if (event.defaultPrevented) event.stopPropagation();
  }

  // Optimistic: kalp anında boyanır, istek arkadan gider; hata olursa geri
  // alınır (mesajı interceptor gösterir). Uçlar idempotent olduğundan hızlı
  // art arda tıklamalar durum bozmaz.
  toggleFavorite(): void {
    if (!this.authStore.isAuthenticated()) {
      this.authModal.open('login');
      return;
    }

    const next = !this.favorite();
    this.favorite.set(next);

    const request = next
      ? this.favoriteService.add(this.boat().id)
      : this.favoriteService.remove(this.boat().id);
    request.subscribe({ error: () => this.favorite.set(!next) });
  }
}
