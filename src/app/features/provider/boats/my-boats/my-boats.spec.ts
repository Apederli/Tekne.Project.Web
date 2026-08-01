import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BoatType, RentalType } from '@enums';
import { BoatOutputModel } from '@models';
import { MyBoats } from './my-boats';

function boat(id: number, name: string): BoatOutputModel {
  return {
    id,
    name,
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

describe('MyBoats', () => {
  let fixture: ComponentFixture<MyBoats>;
  let component: MyBoats;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(MyBoats);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  /** rxResource yanıtı microtask'ta işliyor — akıtıp `whenStable` ile bekliyoruz. */
  async function flush(boats: BoatOutputModel[]): Promise<void> {
    http.expectOne((r) => r.url.endsWith('/Boats/mine')).flush(boats);
    http.expectOne((r) => r.url.endsWith('/Harbors')).flush([
      { cityId: 1, cityName: 'Muğla', harbors: [{ id: 3, name: 'Bodrum Limanı' }] },
    ]);
    await fixture.whenStable();
  }

  it('kendi tekneleri ucundan gelen ilanları listeler', async () => {
    await flush([boat(1, 'Mavi Rüzgar'), boat(2, 'Poyraz')]);

    expect(component.boats().map((b) => b.name)).toEqual(['Mavi Rüzgar', 'Poyraz']);
    const cards = fixture.nativeElement.querySelectorAll('article');
    expect(cards.length).toBe(2);
    expect(cards[0].textContent).toContain('Mavi Rüzgar');
  });

  it('konumu bağlı olduğu liman ve şehir olarak gösterir', async () => {
    await flush([boat(1, 'Mavi Rüzgar')]);

    expect(component.location(boat(1, 'Mavi Rüzgar'))).toBe('Bodrum Limanı, Muğla');
  });

  it('ilan yoksa boş durum gösterir', async () => {
    await flush([]);

    expect(fixture.nativeElement.textContent).toContain('Henüz ilanınız yok');
    expect(fixture.nativeElement.querySelector('article')).toBeNull();
  });
});
