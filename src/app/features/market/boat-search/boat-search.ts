import { Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Params, RouterLink } from '@angular/router';
import { BoatCardOutputModel } from '@models';
import { BoatService } from '@services';
import {
  HlmPagination,
  HlmPaginationContent,
  HlmPaginationEllipsis,
  HlmPaginationItem,
  HlmPaginationLink,
  HlmPaginationNext,
  HlmPaginationPrevious,
  createPageArray,
} from '@ui/pagination';
import { ROUTE_MARKET } from '../../../core/routes.const';
import { BoatCard } from './boat-card';

/** Şeritte aynı anda görünen numara sayısı — fazlası dar ekranda taşıyor. */
const PAGE_LINK_COUNT = 5;

/**
 * Tekne arama/listeleme sayfası. Filtreler henüz yok; şimdilik tüm ilanlar
 * kart ızgarasında listeleniyor. Konum adları backend'den hazır gelir —
 * sayfa şehir/liman lookup'ı yapmaz.
 *
 * Sayfalama sunucu tarafında: sayfa boyutunu backend belirler, istemci yalnızca
 * `?sayfa=` ile sayfa numarasını taşır. Numara URL'de duruyor ki SSR ile
 * render edilen her sayfa ayrı bir adres olsun — arama motoru ikinci sayfayı
 * da tarayabilsin, geri tuşu ve paylaşılan link doğru sayfaya düşsün.
 */
@Component({
  selector: 'app-boat-search',
  imports: [
    BoatCard,
    RouterLink,
    HlmPagination,
    HlmPaginationContent,
    HlmPaginationItem,
    HlmPaginationLink,
    HlmPaginationPrevious,
    HlmPaginationNext,
    HlmPaginationEllipsis,
  ],
  templateUrl: './boat-search.html',
})
export class BoatSearch {
  boatService = inject(BoatService);

  /** `?sayfa=` query paramı — `withComponentInputBinding` ile bağlanır. */
  sayfa = input<string>('1');

  /** Bozuk ya da eksi değer 1'e düşer; elle yazılmış URL bozuk ekran üretmesin. */
  page = computed(() => {
    const parsed = Number(this.sayfa());
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
  });

  boatsResource = rxResource({
    params: () => ({ pageNumber: this.page() }),
    stream: ({ params }) => this.boatService.getList(params),
  });

  loading = computed(() => this.boatsResource.isLoading());

  result = computed(() => (this.boatsResource.hasValue() ? this.boatsResource.value() : null));

  boats = computed(() => this.result()?.items ?? []);

  totalCount = computed(() => this.result()?.totalCount ?? 0);

  totalPages = computed(() => this.result()?.totalPages ?? 0);

  hasPrevious = computed(() => this.result()?.hasPrevious ?? false);

  hasNext = computed(() => this.result()?.hasNext ?? false);

  /**
   * Elle yazılmış, son sayfanın ötesindeki `?sayfa=`. Backend bu isteği son
   * sayfaya kırpmıyor, boş liste dönüyor — dolayısıyla `hasPrevious` de bir
   * önceki boş sayfayı işaret ediyor. Pager burada gizleniyor; çıkışı boş
   * durum mesajındaki "İlk sayfaya dön" linki veriyor.
   */
  outOfRange = computed(() => {
    const result = this.result();
    return !!result && result.totalPages > 0 && result.pageNumber > result.totalPages;
  });

  /**
   * Numara şeridi; `'...'` kısaltmalarını spartan'ın yardımcısı yerleştirir.
   * Sayfa numarası yanıttan okunuyor, `page()`'ten değil — aralık dışı istekte
   * backend son sayfaya değil boş listeye düşüyor, şerit yine de doğru kalsın.
   */
  pages = computed(() => {
    const result = this.result();
    if (!result) return [];

    return createPageArray(result.pageNumber, result.pageSize, result.totalCount, PAGE_LINK_COUNT);
  });

  listUrl = `/${ROUTE_MARKET.boats}`;

  /** İlk sayfa param'sız adreste kalır: `/tekneler` ile `?sayfa=1` aynı sayfayı iki URL yapmasın. */
  queryParamsFor(page: number): Params {
    return { sayfa: page === 1 ? null : page };
  }

  location(boat: BoatCardOutputModel): string {
    return `${boat.primaryHarborName}, ${boat.cityName}`;
  }
}
