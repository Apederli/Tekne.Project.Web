import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { BoatType } from '@enums';
import { BoatCardOutputModel } from '@models';
import { vi } from 'vitest';
import { AuthModalService } from '../auth-modal/auth-modal.service';
import { BoatCard } from './boat-card';

/** Fotoğrafsız tekne: galeri boş durumunu çizer, jsdom'da Swiper'a hiç girilmez. */
function boat(): BoatCardOutputModel {
  return {
    id: 5,
    name: 'Mavi Rüzgar',
    boatType: BoatType.Sailboat,
    boatTypeLabel: 'Yelkenli',
    totalCapacity: 10,
    primaryHarborId: 3,
    primaryHarborName: 'Kandilli',
    cityName: 'İstanbul',
    photos: [],
    isFavorite: false,
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
});
