import { Component, ElementRef, computed, effect, input, viewChild } from '@angular/core';
import { FieldTree } from '@angular/forms/signals';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCalendar, lucideMoonStar, lucideSun } from '@ng-icons/lucide';
import { BrnCalendarI18n, MonthLabels, provideBrnCalendarI18n } from '@spartan-ng/brain/calendar';
import { HlmButton } from '@ui/button';
import { HlmCalendar } from '@ui/calendar';
import { HlmFieldImports } from '@ui/field';
import { HlmPopoverImports } from '@ui/popover';

let nextId = 0;

/** Gece yarısını aşan turlarda ertesi güne uzanan son başlangıç saati. */
const NEXT_DAY_LAST_HOUR = 7;

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  next.setHours(0, 0, 0, 0);
  return next;
}

function referenceWeekday(index: number): Date {
  return new Date(2024, 0, 7 + index);
}

export const TR_CALENDAR_I18N: Partial<BrnCalendarI18n> = {
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

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Gün ve başlangıç saatini tek alanda toplayan seçici: tetikleyici
 * "16.08.2026 08:00" yazar, açılan panelde solda takvim, sağda kaydırmalı
 * saat şeridi durur.
 *
 * İki ayrı Signal Forms alanına bağlanır (`Date | null` ve `'' | '0'…'23'`)
 * çünkü URL ve API tarafında gün ile saat ayrı taşınıyor. Geçmiş saatler
 * bugüne özel kilitlenir; gün değişince geçersiz kalan saat temizlenir.
 */
@Component({
  selector: 'app-datetime-picker',
  imports: [HlmButton, HlmCalendar, HlmFieldImports, HlmPopoverImports, NgIcon],
  providers: [provideBrnCalendarI18n(TR_CALENDAR_I18N)],
  viewProviders: [provideIcons({ lucideCalendar, lucideMoonStar, lucideSun })],
  template: `
    <div hlmField>
      <label hlmFieldLabel [for]="triggerId()">{{ label() }}</label>

      <hlm-popover #picker="brnPopover" align="start" sideOffset="8">
        <button
          hlmPopoverTrigger
          hlmBtn
          type="button"
          variant="outline"
          [id]="triggerId()"
          class="h-11 w-full justify-start gap-2 px-3 font-normal"
        >
          <ng-icon name="lucideCalendar" size="16" class="text-slate-500" aria-hidden="true" />
          <span class="truncate">{{ summary() }}</span>
        </button>

        <hlm-popover-content *hlmPopoverPortal class="w-auto p-0">
          <div class="flex items-stretch">
            <hlm-calendar
              class="rounded-none border-0"
              [date]="date() ?? undefined"
              [min]="min()"
              (dateChange)="setDate($event)"
            />

            <div class="flex w-28 flex-col border-s border-border">
              <p class="border-b border-border py-2 text-center text-sm font-medium">Saat</p>
              <div #hourList class="max-h-72 flex-1 overflow-y-auto p-1.5">
                @for (option of sameDayHours(); track option.hour) {
                  <button
                    type="button"
                    [attr.data-selected]="option.selected"
                    [disabled]="option.disabled"
                    class="flex min-h-10 w-full items-center gap-2 rounded-md px-2 text-sm disabled:opacity-40"
                    [class]="
                      option.selected
                        ? 'bg-primary-deep text-white'
                        : 'hover:bg-accent disabled:hover:bg-transparent'
                    "
                    (click)="setHour(option.hour); picker.close()"
                  >
                    <ng-icon
                      [name]="option.icon"
                      size="16"
                      [class]="option.selected ? 'text-white' : option.iconClass"
                      aria-hidden="true"
                    />
                    <span [class.line-through]="option.disabled">{{ option.label }}</span>
                  </button>
                }

                <p class="mt-1 border-t border-border px-2 pt-2 text-xs font-medium text-slate-500">
                  {{ nextDayLabel() }}
                </p>

                @for (option of nextDayHours(); track option.hour) {
                  <button
                    type="button"
                    class="flex min-h-10 w-full items-center gap-2 rounded-md px-2 text-sm hover:bg-accent"
                    (click)="setHour(option.hour, true); picker.close()"
                  >
                    <ng-icon
                      [name]="option.icon"
                      size="16"
                      [class]="option.iconClass"
                      aria-hidden="true"
                    />
                    {{ option.label }}
                  </button>
                }
              </div>
            </div>
          </div>
        </hlm-popover-content>
      </hlm-popover>
    </div>
  `,
})
export class AppDatetimePicker {
  label = input('Başlangıç Tarihi');

  dateField = input.required<FieldTree<Date | null>>();

  hourField = input.required<FieldTree<string>>();

  min = input<Date>();

  placeholder = input('Tarih seç');

  triggerId = input(`app-datetime-picker-${nextId++}`);

  hourList = viewChild<ElementRef<HTMLElement>>('hourList');

  date = computed(() => this.dateField()().value());

  hour = computed(() => this.hourField()().value());

  summary = computed(() => {
    const date = this.date();
    if (!date) return this.placeholder();

    const day = date.toLocaleDateString('tr-TR');
    const hour = this.hour();
    return hour === '' ? day : `${day} ${this.formatHour(Number(hour))}`;
  });

  /** Bugün seçiliyse geçmiş saatler kapanır; başka günde sınır yok. */
  minHour = computed(() => {
    const date = this.date();
    const now = new Date();
    return date && isSameDay(date, now) ? now.getHours() : null;
  });

  sameDayHours = computed(() =>
    Array.from({ length: 24 }, (_, hour) => {
      const minHour = this.minHour();

      return {
        ...this.hourFace(hour),
        disabled: minHour !== null && hour < minHour,
        selected: this.hour() !== '' && Number(this.hour()) === hour,
      };
    }),
  );

  /** Gece yarısını aşan turlar için ertesi sabahın saatleri. */
  nextDayHours = computed(() =>
    Array.from({ length: NEXT_DAY_LAST_HOUR + 1 }, (_, hour) => this.hourFace(hour)),
  );

  nextDayLabel = computed(() =>
    addDays(this.date() ?? new Date(), 1).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
    }),
  );

  /** Panel açıldığında şerit seçili saate kayar — 08:00 için elle kaydırmasın. */
  revealSelected = effect(() => {
    const list = this.hourList()?.nativeElement;
    if (!list) return;

    const selected = list.querySelector<HTMLElement>('[data-selected="true"]');
    selected?.scrollIntoView({ block: 'center' });
  });

  formatHour = (hour: number): string => `${`${hour}`.padStart(2, '0')}:00`;

  hourFace(hour: number): { hour: number; label: string; icon: string; iconClass: string } {
    const daytime = hour >= 8 && hour <= 19;

    return {
      hour,
      label: this.formatHour(hour),
      icon: daytime ? 'lucideSun' : 'lucideMoonStar',
      iconClass: daytime ? 'text-amber-500' : 'text-indigo-500',
    };
  }

  setDate(date: Date | undefined): void {
    if (!date) return;

    this.dateField()().value.set(date);

    const hour = this.hour();
    const minHour = this.minHour();
    if (hour !== '' && minHour !== null && Number(hour) < minHour) {
      this.hourField()().value.set('');
    }
  }

  /** Ertesi sabahın saati seçilirse gün de bir ileri kayar. */
  setHour(hour: number, nextDay = false): void {
    if (nextDay) this.dateField()().value.set(addDays(this.date() ?? new Date(), 1));

    this.hourField()().value.set(`${hour}`);
  }
}
