import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSearch } from '@ng-icons/lucide';
import {
  hasSearchFilter,
  fromIsoDate,
  parseSearchParams,
} from '../../../core/util/boat-search-params';
import { SearchPanelService } from './search-panel.service';

/**
 * Market başlığındaki arama pill'i. Kendi durumu yok: özeti URL'den türetir,
 * tıklanınca paneli açar. Market'in her sayfasında durur.
 */
@Component({
  selector: 'app-search-trigger',
  imports: [NgIcon],
  viewProviders: [provideIcons({ lucideSearch })],
  template: `
    <button
      type="button"
      class="mx-auto flex w-full items-center gap-3 rounded-full border border-slate-200 px-4 py-2.5 text-start shadow-sm transition-shadow hover:shadow-md lg:max-w-md"
      (click)="open()"
    >
      <ng-icon name="lucideSearch" size="18" class="shrink-0 text-slate-500" aria-hidden="true" />
      <span class="min-w-0">
        <span class="block truncate text-sm font-medium">{{ title() }}</span>
        <span class="block truncate text-xs text-slate-500">{{ subtitle() }}</span>
      </span>
    </button>
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
    if (filter.date) {
      parts.push(
        fromIsoDate(filter.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }),
      );
    }
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

  open(): void {
    this.searchPanelService.open();
  }
}
