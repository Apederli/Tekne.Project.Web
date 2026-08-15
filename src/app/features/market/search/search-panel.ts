import { Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormField, disabled, form } from '@angular/forms/signals';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideAnchor, lucideBuilding2, lucideMoonStar, lucideSun } from '@ng-icons/lucide';
import { BrnCalendarI18n, MonthLabels, provideBrnCalendarI18n } from '@spartan-ng/brain/calendar';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@ui/button';
import { HlmCalendar } from '@ui/calendar';
import { HlmComboboxImports } from '@ui/combobox';
import { HlmDialogTitle } from '@ui/dialog';
import { HlmFieldImports } from '@ui/field';
import { AppStepper } from '@forms';
import { BoatSearchFormModel, IconSelectOption } from '@models';
import { HarborService } from '@services';
import { ROUTE_MARKET } from '../../../core/routes.const';
import {
  SEARCH_MAX_HOURS,
  fromIsoDate,
  parseSearchParams,
  toIsoDate,
  toQueryParams,
} from '../../../core/util/boat-search-params';
import { HourSelect } from './hour-select';

function referenceWeekday(index: number): Date {
  return new Date(2024, 0, 7 + index);
}

function isPastHour(date: Date, hour: number): boolean {
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  return isToday && hour < now.getHours();
}

const TR_CALENDAR_I18N: Partial<BrnCalendarI18n> = {
  formatWeekdayName: (index) =>
    referenceWeekday(index).toLocaleDateString('tr-TR', { weekday: 'short' }),
  labelWeekday: (index) => referenceWeekday(index).toLocaleDateString('tr-TR', { weekday: 'long' }),
  formatMonth: (month) => new Date(2000, month, 1).toLocaleDateString('tr-TR', { month: 'short' }),
  formatYear: (year) => new Date(year, 0, 1).toLocaleDateString('tr-TR', { year: 'numeric' }),
  formatHeader: (month, year) =>
    new Date(year, month, 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
  months: () =>
    Array.from({ length: 12 }, (_, month) =>
      new Date(2000, month, 1).toLocaleDateString('tr-TR', { month: 'long' }),
    ) as MonthLabels,
  labelPrevious: () => 'Önceki ay',
  labelNext: () => 'Sonraki ay',
  firstDayOfWeek: () => 1,
};

type SearchStep = 'location' | 'time';

function initialStep(model: BoatSearchFormModel): SearchStep {
  if (!model.location) return 'location';
  return 'time';
}

@Component({
  selector: 'app-search-panel',
  imports: [
    AppStepper,
    FormField,
    HlmButton,
    HlmCalendar,
    HlmComboboxImports,
    HlmDialogTitle,
    HlmFieldImports,
    HourSelect,
    NgIcon,
  ],
  providers: [provideBrnCalendarI18n(TR_CALENDAR_I18N)],
  viewProviders: [provideIcons({ lucideAnchor, lucideBuilding2, lucideMoonStar, lucideSun })],
  templateUrl: './search-panel.html',
})
export class SearchPanel {
  ref = inject<BrnDialogRef<void>>(BrnDialogRef);
  router = inject(Router);
  route = inject(ActivatedRoute);
  harborService = inject(HarborService);

  minDate = new Date(new Date().setHours(0, 0, 0, 0));

  citiesResource = rxResource({ stream: () => this.harborService.getMarket() });

  cities = computed(() => (this.citiesResource.hasValue() ? this.citiesResource.value() : []));

  queryParams = toSignal(this.route.queryParamMap, { initialValue: convertToParamMap({}) });

  model = computed(() => {
    const filter = parseSearchParams(this.queryParams());

    return {
      location: filter.harborId
        ? `harbor:${filter.harborId}`
        : filter.cityId
          ? `city:${filter.cityId}`
          : '',
      date: filter.date ? fromIsoDate(filter.date) : null,
      startHour: filter.startHour === undefined ? '' : `${filter.startHour}`,
      hours: filter.hours ?? null,
      people: filter.numberOfPeople ?? null,
    } satisfies BoatSearchFormModel;
  });

  searchModel = signal(this.model());

  searchForm = form(this.searchModel, (path) => {
    disabled(path.startHour, { when: ({ valueOf }) => valueOf(path.date) === null });
    disabled(path.hours, {
      when: ({ valueOf }) => valueOf(path.date) === null || valueOf(path.startHour) === '',
    });
  });

  openStep = signal<SearchStep>(initialStep(this.searchModel()));

  prevLocation = this.searchModel().location;

  advanceOnLocation = effect(() => {
    const location = this.searchForm.location().value() ?? '';
    if (location && location !== this.prevLocation) this.openStep.set('time');
    this.prevLocation = location;
  });

  locationSummary = computed(() => this.locationLabel(this.searchForm.location().value()) || 'Seç');

  timeSummary = computed(() => {
    const date = this.searchForm.date().value();
    const startHour = this.searchForm.startHour().value();
    const hours = this.searchForm.hours().value();

    const parts: string[] = [];
    if (date) parts.push(date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }));
    if (startHour !== '') {
      const start = Number(startHour);
      parts.push(
        hours === null
          ? this.formatHour(start)
          : `${this.formatHour(start)} → ${this.endHourLabel(hours)}`,
      );
    }

    return parts.length > 0 ? parts.join(' · ') : 'Seç';
  });

  hourOptions = Array.from({ length: 24 }, (_, hour) => `${hour}`);

  formatHour = (hour: number): string => `${`${hour}`.padStart(2, '0')}:00`;

  hourLabel = (hour: string): string => this.formatHour(Number(hour));

  isDaytime = (hour: number): boolean => hour >= 8 && hour <= 19;

  hourIcon = (hour: number): string => (this.isDaytime(hour) ? 'lucideSun' : 'lucideMoonStar');

  hourIconColor = (hour: number): string =>
    this.isDaytime(hour) ? 'text-amber-500' : 'text-indigo-500';

  durationOptions = Array.from({ length: SEARCH_MAX_HOURS }, (_, i) => i + 1);

  endHourOf = (duration: number): number =>
    Number(this.searchForm.startHour().value() || 0) + duration;

  endHourLabel = (duration: number): string => {
    const end = this.endHourOf(duration);
    return `${this.formatHour(end % 24)}${end >= 24 ? ' (+1 gün)' : ''}`;
  };

  endHourIcon = (duration: number): string => this.hourIcon(this.endHourOf(duration) % 24);

  endHourIconColor = (duration: number): string =>
    this.hourIconColor(this.endHourOf(duration) % 24);

  minHourToday = computed(() => {
    const date = this.searchForm.date().value();
    if (!date) return null;

    const now = new Date();
    const isToday =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();

    return isToday ? now.getHours() : null;
  });

  isHourDisabled = (hour: string): boolean => {
    const minHour = this.minHourToday();
    return minHour !== null && Number(hour) < minHour;
  };

  startHourOptions = computed<IconSelectOption<string>[]>(() =>
    this.hourOptions.map((hour) => ({
      value: hour,
      label: this.hourLabel(hour),
      icon: this.hourIcon(Number(hour)),
      iconClass: this.hourIconColor(Number(hour)),
      disabled: this.isHourDisabled(hour),
    })),
  );

  endHourOptions = computed<IconSelectOption<number>[]>(() =>
    this.durationOptions.map((duration) => ({
      value: duration,
      label: this.endHourLabel(duration),
      icon: this.endHourIcon(duration),
      iconClass: this.endHourIconColor(duration),
    })),
  );

  cityLabel(cityName: string): string {
    return `${cityName} — tüm limanlar`;
  }

  locationLabel = (value: string | null): string => {
    const [kind, rawId] = (value ?? '').split(':');
    const id = Number(rawId);

    for (const city of this.cities()) {
      if (kind === 'city' && city.cityId === id) return this.cityLabel(city.cityName);
      const harbor = city.harbors.find((h) => h.id === id);
      if (kind === 'harbor' && harbor) return `${harbor.name}, ${city.cityName}`;
    }

    return '';
  };

  setDate(date: Date | undefined): void {
    const value = date ?? null;
    this.searchForm.date().value.set(value);

    const startHour = this.searchForm.startHour().value();
    if (value && startHour !== '' && isPastHour(value, Number(startHour))) {
      this.searchForm.startHour().value.set('');
    }
  }

  search(): void {
    const value = this.searchForm().value();
    const [kind, rawId] = (value.location ?? '').split(':');
    const id = Number(rawId);

    const timeSelected = value.date !== null && value.startHour !== '';

    this.router.navigate(['/', ROUTE_MARKET.boats], {
      queryParams: toQueryParams({
        cityId: kind === 'city' ? id : undefined,
        harborId: kind === 'harbor' ? id : undefined,
        date: value.date ? toIsoDate(value.date) : undefined,
        startHour: timeSelected ? Number(value.startHour) : undefined,
        hours: timeSelected ? (value.hours ?? undefined) : undefined,
        numberOfPeople: value.people ?? undefined,
      }),
      queryParamsHandling: 'merge',
    });

    this.ref.close();
  }

  clear(): void {
    this.searchModel.set({
      location: '',
      date: null,
      startHour: '',
      hours: null,
      people: null,
    });
    this.openStep.set('location');
  }
}
