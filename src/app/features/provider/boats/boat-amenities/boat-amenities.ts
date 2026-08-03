import { Component, computed, inject, linkedSignal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Subject, catchError, debounceTime, map, of, switchMap } from 'rxjs';
import { HlmCheckboxImports } from '@ui/checkbox';
import { HlmLabel } from '@ui/label';
import { HlmSkeleton } from '@ui/skeleton';
import { AmenityService, BoatAmenityService, BoatService } from '@services';

/**
 * Arka arkaya tıklamada her tık ayrı istek atmasın diye. `switchMap` ile
 * birlikte, tampon süresi dolmadan gelen tıklar tek isteğe birleşir.
 */
const SAVE_DEBOUNCE_MS = 300;

/**
 * Düzenleme sayfasının "İmkanlar" sekmesi.
 *
 * İki kaynağı birleştirir: katalog (`GET /api/Amenities`) ve teknenin işaretleri
 * (`GET /api/Boats/{id}` içindeki `amenities`). Şartlar sekmesinden farkı,
 * katalogun tekneye bağımlı olmaması — kiralama tipi süzgeci yok, bu yüzden iki
 * istek paralel gider.
 *
 * Kaydet butonu yok — her değişiklik otomatik `PUT` edilir. Uç tam eşitleme
 * yaptığı için her seferinde listenin tamamı gider.
 */
@Component({
  selector: 'app-boat-amenities',
  imports: [HlmCheckboxImports, HlmLabel, HlmSkeleton],
  templateUrl: './boat-amenities.html',
})
export class BoatAmenities {
  route = inject(ActivatedRoute);
  boatService = inject(BoatService);
  amenityService = inject(AmenityService);
  boatAmenityService = inject(BoatAmenityService);

  /**
   * Sekme olduğu için route paramı input'a bağlanmıyor; kapsayıcının
   * route'undan okunur (`withComponentInputBinding` yalnızca route'a bağlı
   * bileşenlere işler).
   */
  boatId = toSignal(this.route.paramMap.pipe(map((p) => p.get('boatId'))), {
    initialValue: null,
  });

  boatResource = rxResource({
    params: () => {
      const id = this.boatId();
      return id ? Number(id) : undefined;
    },
    stream: ({ params }) => this.boatService.getById(params),
  });

  boat = computed(() => (this.boatResource.hasValue() ? this.boatResource.value() : null));

  catalogResource = rxResource({
    stream: () => this.amenityService.getList(),
  });

  catalog = computed(() => (this.catalogResource.hasValue() ? this.catalogResource.value() : []));

  loading = computed(() => this.boatResource.isLoading() || this.catalogResource.isLoading());
  failed = computed(
    () => this.boatResource.status() === 'error' || this.catalogResource.status() === 'error',
  );

  /** Ekrandaki seçim. Tekne yeniden yüklenirse sunucudaki hâle döner. */
  selectedIds = linkedSignal<number[]>(() => (this.boat()?.amenities ?? []).map((a) => a.id));

  /**
   * Sunucudaki son bilinen seçim. Kayıt hata verirse ekran buraya geri alınır —
   * kullanıcı kaydedilmemiş bir seçime bakmaya devam etmesin.
   */
  serverIds = linkedSignal<number[]>(() => (this.boat()?.amenities ?? []).map((a) => a.id));

  selected = computed(() => new Set(this.selectedIds()));

  /**
   * Yükleme iskeletinin ölçüsü. Katalog daha gelmediği için gerçek sayı
   * bilinmiyor; on iki satır tipik bir katalogun yarısı kadar bir yer tutucu.
   */
  skeletonRows = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  saveRequests = new Subject<number[]>();

  constructor() {
    this.saveRequests
      .pipe(
        debounceTime(SAVE_DEBOUNCE_MS),
        switchMap((ids) => {
          const boatId = this.boat()?.id;
          if (!boatId) return of(null);
          return this.boatAmenityService.set(boatId, ids).pipe(
            map(() => ids),
            // Hata mesajını interceptor gösteriyor; buradaki tek iş, ekranı
            // kaydedilemeyen bir seçimde bırakmamak.
            catchError(() => of(null)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((ids) => {
        if (ids) this.serverIds.set(ids);
        else this.selectedIds.set(this.serverIds());
      });
  }

  isSelected(amenityId: number): boolean {
    return this.selected().has(amenityId);
  }

  /** İmkanlar bağımsız işaretlenir — grup ya da tek seçim kısıtı yok. */
  onToggle(amenityId: number, checked: boolean): void {
    const next = checked
      ? [...this.selectedIds(), amenityId]
      : this.selectedIds().filter((id) => id !== amenityId);

    this.selectedIds.set(next);
    this.saveRequests.next(next);
  }
}
