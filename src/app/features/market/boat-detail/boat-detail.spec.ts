import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { BoatType, RentalType } from '@enums';
import { BoatOutputModel, BoatPhotoOutputModel } from '@models';

// jsdom Swiper'ın shadow DOM render'ını taşıyamıyor — photo-gallery.spec ile aynı sebep.
vi.mock('swiper/element/bundle', () => ({ register: () => {} }));
import { BoatDetail } from './boat-detail';

function photo(id: number, sortOrder: number, isMain = false): BoatPhotoOutputModel {
  return { id, objectKey: `boat-image/${id}.webp`, isMain, sortOrder };
}

function boat(photos: BoatPhotoOutputModel[]): BoatOutputModel {
  return {
    id: 5,
    name: 'Mavi Rüzgar',
    boatType: BoatType.Sailboat,
    rentalType: RentalType.Hourly,
    manufactureYear: 2019,
    lengthInMeters: 12,
    diningCapacity: 0,
    totalCapacity: 10,
    swimmingCapacity: 8,
    cityId: 1,
    primaryHarborId: 3,
    harborIds: [3],
    ownerId: 7,
    description: 'Ege koylarına günlük turlar.',
    isActive: true,
    photos,
  };
}

describe('BoatDetail', () => {
  let fixture: ComponentFixture<BoatDetail>;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
  });

  function create(slug: string): void {
    fixture = TestBed.createComponent(BoatDetail);
    fixture.componentRef.setInput('slug', slug);
    fixture.detectChanges();
  }

  afterEach(() => http.verify());

  async function flush(model: BoatOutputModel): Promise<void> {
    http.expectOne((r) => r.url.endsWith('/Boats/5')).flush(model);
    http
      .expectOne((r) => r.url.endsWith('/Harbors'))
      .flush([{ cityId: 1, cityName: 'Muğla', harbors: [{ id: 3, name: 'Bodrum Limanı' }] }]);
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it("slug'daki id ile tekneyi çeker ve künyeyi çizer", async () => {
    create('mavi-ruzgar-5');
    await flush(boat([photo(1, 0, true)]));

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('Mavi Rüzgar');
    expect(el.textContent).toContain('Bodrum Limanı, Muğla');
    expect(el.textContent).toContain('Yelkenli');
    expect(el.textContent).toContain('10 kişi');
    expect(el.textContent).toContain('Ege koylarına günlük turlar.');
  });

  it('sayfa başlığına tekne adını yazar', async () => {
    create('mavi-ruzgar-5');
    await flush(boat([photo(1, 0, true)]));

    expect(TestBed.inject(Title).getTitle()).toBe('Mavi Rüzgar — Tekne');
  });

  it('5 ten çok fotoğrafta mozaik 5 görsel ve +N çipi gösterir', async () => {
    create('mavi-ruzgar-5');
    await flush(boat([0, 1, 2, 3, 4, 5, 6].map((i) => photo(i + 1, i, i === 0))));

    const mosaic = fixture.nativeElement.querySelector('[data-testid="mosaic"]');
    expect(mosaic.querySelectorAll('img').length).toBe(5);
    expect(mosaic.textContent).toContain('+2 fotoğraf');
  });

  it('tek fotoğrafta mozaikte yalnız kapak vardır, çip yoktur', async () => {
    create('mavi-ruzgar-5');
    await flush(boat([photo(1, 0, true)]));

    const mosaic = fixture.nativeElement.querySelector('[data-testid="mosaic"]');
    expect(mosaic.querySelectorAll('img').length).toBe(1);
    expect(mosaic.textContent).not.toContain('fotoğraf');
  });

  it('tam 5 fotoğrafta mozaik 5 görsel gösterir, çip yoktur', async () => {
    create('mavi-ruzgar-5');
    await flush(boat([0, 1, 2, 3, 4].map((i) => photo(i + 1, i, i === 0))));

    const mosaic = fixture.nativeElement.querySelector('[data-testid="mosaic"]');
    expect(mosaic.querySelectorAll('img').length).toBe(5);
    expect(mosaic.textContent).not.toContain('fotoğraf');
  });

  it('2 fotoğrafta mozaik 2 görsel gösterir, çip yoktur', async () => {
    create('mavi-ruzgar-5');
    await flush(boat([photo(1, 0, true), photo(2, 1)]));

    const mosaic = fixture.nativeElement.querySelector('[data-testid="mosaic"]');
    expect(mosaic.querySelectorAll('img').length).toBe(2);
    expect(mosaic.textContent).not.toContain('fotoğraf');
  });

  it('fotoğrafsız teknede mozaik "Fotoğraf yok" gösterir', async () => {
    create('mavi-ruzgar-5');
    await flush(boat([]));

    const mosaic = fixture.nativeElement.querySelector('[data-testid="mosaic"]');
    expect(mosaic.querySelectorAll('img').length).toBe(0);
    expect(mosaic.textContent).toContain('Fotoğraf yok');
  });

  it("bozuk slug'da istek açmaz ve bulunamadı gösterir", () => {
    create('tekne');

    http.expectNone((r) => r.url.includes('/Boats/'));
    http.expectOne((r) => r.url.endsWith('/Harbors')).flush([]);
    expect(fixture.nativeElement.textContent).toContain('Tekne bulunamadı');
  });

  it('404 te bulunamadı gösterir', async () => {
    create('mavi-ruzgar-5');
    http
      .expectOne((r) => r.url.endsWith('/Boats/5'))
      .flush({ message: 'yok' }, { status: 404, statusText: 'Not Found' });
    http.expectOne((r) => r.url.endsWith('/Harbors')).flush([]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Tekne bulunamadı');
  });
});
