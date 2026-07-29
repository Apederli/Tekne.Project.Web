import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BoatType } from '@enums/boat-type';
import { RentalType } from '@enums/rental-type';
import { BoatFormModel } from '@models/boat';
import { BoatForm } from './boat-form';

/** Backend `BoatInputModelValidator`'ının kabul ettiği asgari geçerli form. */
const validModel: BoatFormModel = {
  name: 'Mavi Rüzgar',
  boatType: BoatType.Sailboat,
  rentalType: RentalType.Hourly,
  manufactureYear: null,
  lengthInMeters: 12.5,
  diningCapacity: 0,
  totalCapacity: 10,
  swimmingCapacity: 8,
  cityId: '1',
  primaryHarborId: '3',
  harborIds: [3, 4],
  description: '',
};

describe('BoatForm', () => {
  let component: BoatForm;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);

    component = TestBed.createComponent(BoatForm).componentInstance;
    http
      .expectOne((req) => req.method === 'GET' && req.url.endsWith('/Harbors'))
      .flush([
        {
          cityId: 1,
          cityName: 'Muğla',
          harbors: [
            { id: 3, name: 'Bodrum Limanı' },
            { id: 4, name: 'Yalıkavak Marina' },
          ],
        },
      ]);
  });

  afterEach(() => http.verify());

  it('boş form geçersizdir ve gönderimde istek atmaz', async () => {
    await component.save();

    http.expectNone((req) => req.method === 'POST');
    expect(component.boatForm().invalid()).toBe(true);
    expect(component.boatForm.name().errors()[0].message).toBe('Tekne adı gerekli.');
  });

  it('geçerli formu sayısal alanları çevirerek POST eder', async () => {
    component.model.set(validModel);

    const saving = component.save();
    const req = http.expectOne((r) => r.method === 'POST' && r.url.endsWith('/Boats'));
    req.flush(42);
    await saving;

    expect(req.request.body).toEqual({
      name: 'Mavi Rüzgar',
      boatType: BoatType.Sailboat,
      rentalType: RentalType.Hourly,
      manufactureYear: undefined,
      lengthInMeters: 12.5,
      diningCapacity: 0,
      totalCapacity: 10,
      swimmingCapacity: 8,
      cityId: 1,
      primaryHarborId: 3,
      harborIds: [3, 4],
      description: undefined,
    });
  });

  it('ana liman seçili limanlar arasında değilse formu geçersiz sayar', () => {
    component.model.set({ ...validModel, primaryHarborId: '99' });

    expect(component.boatForm().invalid()).toBe(true);
    expect(component.boatForm.primaryHarborId().errors()[0].message).toBe(
      'Ana liman, seçili limanlar arasında olmalı.',
    );
  });

  it('üretim yılını 1900-2100 aralığında ister, boş bırakılabilir', () => {
    component.model.set({ ...validModel, manufactureYear: 1899 });
    expect(component.boatForm.manufactureYear().errors().length).toBe(1);

    component.model.set({ ...validModel, manufactureYear: null });
    expect(component.boatForm().valid()).toBe(true);
  });

  it('uzunluk ve toplam kapasite için 0 değerini reddeder', () => {
    component.model.set({ ...validModel, lengthInMeters: 0, totalCapacity: 0 });

    expect(component.boatForm.lengthInMeters().errors()[0].message).toBe(
      'Uzunluk 0’dan büyük olmalı.',
    );
    expect(component.boatForm.totalCapacity().errors()[0].message).toBe(
      'Toplam kapasite en az 1 olmalı.',
    );
  });

  it('ana liman işaretlenen liman seçili listede değilse listeye ekler', () => {
    component.model.set({ ...validModel, harborIds: [4], primaryHarborId: '' });

    component.setPrimaryHarbor(3);

    expect(component.model().harborIds).toEqual([4, 3]);
    expect(component.model().primaryHarborId).toBe('3');
  });

  it('liman seçimi kalkınca ana liman seçimi de düşer', () => {
    component.model.set(validModel);

    component.toggleHarbor(3, false);

    expect(component.model().harborIds).toEqual([4]);
    expect(component.model().primaryHarborId).toBe('');
  });

  it('şehir değişince liman seçimlerini sıfırlar', () => {
    component.model.set(validModel);

    component.onCityChange();

    expect(component.model().harborIds).toEqual([]);
    expect(component.model().primaryHarborId).toBe('');
  });
});
