import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideHeart, lucideStar } from '@ng-icons/lucide';
import { BoatCardOutputModel } from '@models';
import { PhotoGallery } from '../../../shared/photo-gallery/photo-gallery';
import { makeBoatSlug } from '../../../core/util/boat-slug';
import { ROUTE_MARKET } from '../../../core/routes.const';
import { AuthStore } from '../../../core/auth/auth-store';
import { AuthModalService } from '../auth-modal/auth-modal.service';

@Component({
  selector: 'app-boat-card',
  imports: [NgIcon, PhotoGallery, RouterLink],
  providers: [provideIcons({ lucideHeart, lucideStar })],
  templateUrl: './boat-card.html',
})
export class BoatCard {
  authStore = inject(AuthStore);
  authModal = inject(AuthModalService);

  boat = input.required<BoatCardOutputModel>();

  location = input('');

  departure = input('');

  // TODO(backend): favori uçları yok — durum sayfa ömürlük, yalnızca görsel test için.
  favorite = signal(false);

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

  toggleFavorite(): void {
    if (!this.authStore.isAuthenticated()) {
      this.authModal.open('login');
      return;
    }
    this.favorite.update((f) => !f);
  }
}
