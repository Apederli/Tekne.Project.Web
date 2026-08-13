import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { BoatCardOutputModel } from '@models';
import { vi } from 'vitest';
import { AuthModalService } from '../auth-modal/auth-modal.service';
import { BoatCard } from './boat-card';

/** Fotoğrafsız tekne: galeri boş durumunu çizer, jsdom'da Swiper'a hiç girilmez. */
function boat(overrides: Partial<BoatCardOutputModel> = {}): BoatCardOutputModel {
  return {
    id: 5,
    name: 'Mavi Rüzgar',
    boatTypeLabel: 'Yelkenli',
    totalCapacity: 10,
    primaryHarborName: 'Kandilli',
    cityName: 'İstanbul',
    photos: [],
    isFavorite: false,
    rate: 1500,
    rateUnitLabel: 'saat',
    ...overrides,
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

  it('konum verilmediğinde linkin erişilebilir adı yalnızca tekne tipidir', () => {
    const link = fixture.nativeElement.querySelector('a');
    expect(link?.getAttribute('aria-label')).toBe('Yelkenli');
  });

  it('misafirin kalp tıklaması giriş modalını açar, navigasyon tetiklemez', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl');
    const openModal = vi
      .spyOn(TestBed.inject(AuthModalService), 'open')
      .mockImplementation(() => {});

    const link = fixture.nativeElement.querySelector('a');
    const button = fixture.nativeElement.querySelector('button');
    // Kalp linkin İÇİNDE değil KARDEŞİ olmalı — nested buton geçersiz HTML olurdu.
    expect(link.contains(button)).toBe(false);

    button.click();
    fixture.detectChanges();

    expect(openModal).toHaveBeenCalledWith('login');
    expect(fixture.componentInstance.favorite()).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('ücreti Türkçe binlik ayıracı ve birimiyle basar', () => {
    expect(fixture.nativeElement.textContent).toContain('₺1.500 / saat');
  });

  // Kart tutar taşımaz: süre seçilse de rakam saat başına ortalamaya iner, toplamı detay hesaplar.
  it('süre seçildiğinde ücret ortalamaya iner, toplam basılmaz', () => {
    fixture.componentRef.setInput('boat', boat({ rate: 2500 }));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('₺2.500 / saat');
    expect(fixture.nativeElement.textContent).not.toContain('Toplam');
  });

  it('fiyatı girilmemiş teknede ücret satırı hiç basılmaz', () => {
    fixture.componentRef.setInput('boat', boat({ rate: undefined }));
    fixture.detectChanges();

    expect(fixture.componentInstance.priceLabel()).toBe('');
    expect(fixture.nativeElement.textContent).not.toContain('/ saat');
  });

  it('gecelik teknede birim gece olarak basılır', () => {
    fixture.componentRef.setInput('boat', boat({ rate: 9000, rateUnitLabel: 'gece' }));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('₺9.000 / gece');
  });
});
