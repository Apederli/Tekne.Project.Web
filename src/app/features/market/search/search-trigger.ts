import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink, convertToParamMap } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSearch } from '@ng-icons/lucide';
import { ROUTE_MARKET } from '../../../core/routes.const';
import {
  hasSearchFilter,
  fromIsoDate,
  nightsBetween,
  parseSearchParams,
} from '../../../core/util/boat-search-params';
import { SearchPanelService } from './search-panel.service';

/**
 * Market başlığındaki arama pill'i. Kendi durumu yok: özeti URL'den türetir,
 * tıklanınca paneli açar. Market'in her sayfasında durur.
 */
@Component({
  selector: 'app-search-trigger',
  imports: [NgIcon, RouterLink],
  viewProviders: [provideIcons({ lucideSearch })],
  template: `
    <div
      class="mx-auto flex w-full items-center rounded-full border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md lg:max-w-md"
    >
      <button
        type="button"
        class="min-w-0 flex-1 rounded-full py-2.5 ps-4 text-start"
        (click)="open()"
      >
        <span class="block truncate text-sm font-medium">{{ title() }}</span>
        <span class="block truncate text-xs text-slate-500">{{ subtitle() }}</span>
      </button>

      <a
        [routerLink]="listUrl"
        class="mx-1.5 flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-deep text-white hover:bg-primary-deep-hover"
        aria-label="Filtresiz tüm tekneleri göster"
      >
        <ng-icon name="lucideSearch" size="18" aria-hidden="true" />
      </a>
    </div>
  `,
})
export class SearchTrigger {
  route = inject(ActivatedRoute);
  searchPanelService = inject(SearchPanelService);

  queryParams = toSignal(this.route.queryParamMap, { initialValue: convertToParamMap({}) });

  filter = computed(() => parseSearchParams(this.queryParams()));

  searching = computed(() => hasSearchFilter(this.filter()));

  title = computed(() => (this.searching() ? 'Aramanı düzenle' : 'Nereye gitmek istiyorsun?'));

  /**
   * Aktif filtrelerin özeti. Konum adı burada çözülmüyor — liman/şehir listesi
   * ayrı bir istek ve pill her sayfada render ediliyor; sayıyı ada çevirmek
   * için başlıkta bir istek daha atmak istemiyoruz.
   */
  subtitle = computed(() => {
    const filter = this.filter();
    if (!this.searching()) return 'Bölge · Tarih · Misafir sayısı';

    const parts: string[] = [];
    if (filter.checkIn) {
      const checkIn = fromIsoDate(filter.checkIn);
      parts.push(this.dayLabel(checkIn));
      if (filter.checkOut) {
        const checkOut = fromIsoDate(filter.checkOut);
        parts.push(`${this.dayLabel(checkOut)} · ${nightsBetween(checkIn, checkOut)} gece`);
      }
    }
    if (filter.date) parts.push(this.dayLabel(fromIsoDate(filter.date)));
    if (filter.startHour !== undefined) {
      const pad = (hour: number) => `${hour}`.padStart(2, '0');
      if (filter.hours === undefined) {
        parts.push(`${pad(filter.startHour)}:00`);
      } else {
        const end = filter.startHour + filter.hours;
        parts.push(
          `${pad(filter.startHour)}:00 → ${pad(end % 24)}:00${end >= 24 ? ' (+1 gün)' : ''}`,
        );
      }
    }
    if (filter.numberOfPeople !== undefined) parts.push(`${filter.numberOfPeople} kişi`);

    return parts.length > 0 ? parts.join(' · ') : 'Seçili konum';
  });

  listUrl = `/${ROUTE_MARKET.boats}`;

  dayLabel = (date: Date): string =>
    date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });

  open(): void {
    this.searchPanelService.open();
  }
}
