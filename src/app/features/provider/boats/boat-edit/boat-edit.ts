import { Component, computed, inject, input } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { HlmButton } from '@ui/button';
import { HlmTabsImports } from '@ui/tabs';
import { FormMode } from '@enums';
import { BoatService } from '@services';
import { BoatAmenities } from '../boat-amenities/boat-amenities';
import { BoatForm } from '../boat-form/boat-form';
import { BoatPhotos } from '../boat-photos/boat-photos';
import { BoatTerms } from '../boat-terms/boat-terms';
import { BoatPricing } from '../boat-pricing/boat-pricing';
import { BOAT_EDIT_TABS, ROUTE_PARTNER } from '../../../../core/routes.const';

const TAB_SLUGS: string[] = Object.values(BOAT_EDIT_TABS);

/**
 * Tekne düzenleme sayfası — beş sekmenin kapsayıcısı.
 *
 * Tekneyi yalnızca **başlık için** yükler; her sekme kendi verisini kendi
 * çeker (tasarım kararı: sekmeler birbirinden ve kapsayıcıdan bağımsız).
 * Sekme içerikleri `hlmTabsContentLazy` ile ilk açılışa kadar render
 * edilmez, böylece girilmeyen sekme istek atmaz.
 */
@Component({
  selector: 'app-boat-edit',
  imports: [
    RouterLink,
    HlmButton,
    HlmTabsImports,
    BoatForm,
    BoatPhotos,
    BoatTerms,
    BoatAmenities,
    BoatPricing,
  ],
  templateUrl: './boat-edit.html',
})
export class BoatEdit {
  router = inject(Router);
  route = inject(ActivatedRoute);
  boatService = inject(BoatService);

  /** Route paramı ve query paramı — ikisi de `withComponentInputBinding` ile gelir. */
  boatId = input.required<string>();
  sekme = input<string>(BOAT_EDIT_TABS.general);

  /** Şablonda `[screenOpenType]` ve `[hlmTabsTrigger]` için. */
  FormMode = FormMode;
  tabs = BOAT_EDIT_TABS;

  boatsUrl = ['/', ROUTE_PARTNER.main, ROUTE_PARTNER.dashboard, ROUTE_PARTNER.boats];

  /** Tanınmayan slug Genel'e düşer — elle yazılmış URL bozuk ekran üretmesin. */
  activeTab = computed(() =>
    TAB_SLUGS.includes(this.sekme()) ? this.sekme() : BOAT_EDIT_TABS.general,
  );

  boatResource = rxResource({
    params: () => Number(this.boatId()),
    stream: ({ params }) => this.boatService.getById(params),
  });

  loading = computed(() => this.boatResource.isLoading());
  failed = computed(() => this.boatResource.status() === 'error');

  boat = computed(() => (this.boatResource.hasValue() ? this.boatResource.value() : null));

  /**
   * `replaceUrl` bilinçli: sekme gezinmesi geçmişe yığılmaz, geri tuşu
   * kullanıcıyı teknelerim listesine döndürür.
   */
  onTabActivated(slug: string): void {
    if (slug === this.activeTab()) return;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sekme: slug },
      replaceUrl: true,
    });
  }
}
