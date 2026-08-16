import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormField, form } from '@angular/forms/signals';
import { ActivatedRoute, RouterLink, convertToParamMap } from '@angular/router';
import { AppDatetimePicker, AppStepper } from '@forms';
import { BoatBookingFormModel, BoatOutputModel, BoatQuoteOutputModel, SelectOption } from '@models';
import { BoatService } from '@services';
import { HlmButton } from '@ui/button';
import { HlmFieldImports } from '@ui/field';
import { HlmSelectImports } from '@ui/select';
import { HlmSkeleton } from '@ui/skeleton';
import { ROUTE_MARKET } from '../../../core/routes.const';
import {
  SEARCH_MAX_HOURS,
  fromIsoDate,
  parseSearchParams,
  toIsoDate,
} from '../../../core/util/boat-search-params';

const priceFormat = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Aramadan tarih gelmediğinde kart yarına 10:00 ile açılır. */
const DEFAULT_START_HOUR = '10';

function tomorrow(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Detay sayfasının rezervasyon kartı — yalnızca saatlik teknelerde çizilir.
 *
 * Alanlar aramadan devralınır (liman, tarih, başlangıç saati, süre, kişi):
 * kullanıcı listede ne seçtiyse kart onunla açılır, aramasız gelindiğinde
 * yarın 10:00 ve teknenin en kısa kiralama süresi kullanılır.
 *
 * Tutarları backend hesaplar: her seçim değişiminde `/quote` çağrılır, saat
 * ücreti bile yanıttan okunur — tarife güne göre değişebiliyor.
 */
@Component({
  selector: 'app-booking-card',
  imports: [
    AppDatetimePicker,
    AppStepper,
    FormField,
    HlmButton,
    HlmFieldImports,
    HlmSelectImports,
    HlmSkeleton,
    RouterLink,
  ],
  templateUrl: './booking-card.html',
})
export class BookingCard {
  boatService = inject(BoatService);
  route = inject(ActivatedRoute);

  boat = input.required<BoatOutputModel>();

  queryParams = toSignal(this.route.queryParamMap, { initialValue: convertToParamMap({}) });

  minDate = new Date(new Date().setHours(0, 0, 0, 0));

  bookingUrl = ['/', ROUTE_MARKET.booking];

  minHours = computed(() => Math.max(1, this.boat().minimumRentalDuration || 1));

  bookingModel = linkedSignal<BoatBookingFormModel>(() => {
    const boat = this.boat();
    const filter = parseSearchParams(this.queryParams());
    const fromSearch = boat.harbors.some((harbor) => harbor.id === filter.harborId);

    return {
      harborId: String(fromSearch ? filter.harborId : boat.primaryHarborId),
      date: filter.date ? fromIsoDate(filter.date) : tomorrow(),
      startHour: filter.startHour === undefined ? DEFAULT_START_HOUR : `${filter.startHour}`,
      hours: filter.hours ?? this.minHours(),
      people: filter.numberOfPeople ?? 1,
    };
  });

  bookingForm = form(this.bookingModel);

  harborOptions = computed<SelectOption<string>[]>(() =>
    this.boat().harbors.map((harbor) => ({ value: String(harbor.id), label: harbor.name })),
  );

  harborLabel = (value: string): string =>
    this.harborOptions().find((option) => option.value === value)?.label ?? '';

  maxPeople = computed(() => this.boat().totalCapacity);

  maxHours = SEARCH_MAX_HOURS;

  quoteParams = computed(() => {
    const date = this.bookingForm.date().value();
    const startHour = this.bookingForm.startHour().value();
    const hours = this.bookingForm.hours().value();
    if (!date || startHour === '' || !hours) return undefined;

    return { id: this.boat().id, date: toIsoDate(date), startHour: Number(startHour), hours };
  });

  quoteResource = rxResource({
    params: () => this.quoteParams(),
    stream: ({ params }) =>
      this.boatService.getQuote(params.id, {
        date: params.date,
        startHour: params.startHour,
        hours: params.hours,
      }),
  });

  /**
   * Yeni teklif gelene kadar bir öncekini tutar: süre her değiştiğinde tutar
   * bloğu iskelete düşüp geri gelmiyor, yalnız rakamlar tazeleniyor. Hata
   * durumunda eldeki teklif düşürülür — yanlış tutar göstermek yerine boş.
   */
  quote = linkedSignal<
    { status: string; value: BoatQuoteOutputModel | undefined },
    BoatQuoteOutputModel | null
  >({
    source: () => ({ status: this.quoteResource.status(), value: this.quoteResource.value() }),
    computation: (source, previous) =>
      source.status === 'error' ? null : (source.value ?? previous?.value ?? null),
  });

  quoteLoading = computed(() => this.quoteResource.isLoading());

  quoteFailed = computed(() => this.quoteResource.status() === 'error');

  onBoardAmount = computed(() => {
    const quote = this.quote();
    return quote ? quote.total - quote.prePayment : 0;
  });

  bookingParams = computed(() => {
    const value = this.bookingForm().value();

    return {
      boat: this.boat().id,
      harbor: value.harborId,
      date: value.date ? toIsoDate(value.date) : null,
      startHour: value.startHour === '' ? null : Number(value.startHour),
      hours: value.hours,
      people: value.people,
    };
  });

  price = (value: number): string => `₺${priceFormat.format(value)}`;
}
