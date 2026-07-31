import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { BoatType, RentalType } from '@enums';
import { BoatOutputModel } from '@models';
import { vi } from 'vitest';
import { BoatCard } from './boat-card';

/** Fotoğrafsız tekne: galeri boş durumunu çizer, jsdom'da Swiper'a hiç girilmez. */
function boat(): BoatOutputModel {
  return {
    id: 5,
    name: 'Mavi Rüzgar',
    boatType: BoatType.Sailboat,
    rentalType: RentalType.Hourly,
    lengthInMeters: 12,
    diningCapacity: 0,
    totalCapacity: 10,
    swimmingCapacity: 8,
    cityId: 1,
    primaryHarborId: 3,
    harborIds: [3],
    ownerId: 7,
    isActive: true,
    photos: [],
  };
}

describe('BoatCard', () => {
  let fixture: ComponentFixture<BoatCard>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(BoatCard);
    fixture.componentRef.setInput('boat', boat());
    fixture.detectChanges();
  });

  it("kartın tamamı slug'lı detay linkidir", () => {
    const link = fixture.nativeElement.querySelector('a');
    expect(link?.getAttribute('href')).toBe('/tekne/mavi-ruzgar-5');
  });

  it('konum verilmediğinde linkin erişilebilir adı yalnızca tekne adıdır', () => {
    const link = fixture.nativeElement.querySelector('a');
    expect(link?.getAttribute('aria-label')).toBe('Mavi Rüzgar');
  });

  it('kalp tıklaması favoriyi değiştirir, navigasyon tetiklemez', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl');

    const link = fixture.nativeElement.querySelector('a');
    const button = fixture.nativeElement.querySelector('button');
    // Kalp linkin İÇİNDE değil KARDEŞİ olmalı — nested buton geçersiz HTML olurdu.
    expect(link.contains(button)).toBe(false);

    button.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.favorite()).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });
});
