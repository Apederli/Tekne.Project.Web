import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BoatType, RentalType } from '@enums';
import { BoatFormModel } from '@models';
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
  minimumRentalDuration: 1,
  cityId: '1',
  primaryHarborId: '3',
  harborIds: [3, 4],
  description: '',
};

describe('BoatForm', () => {
  let fixture: ComponentFixture<BoatForm>;
  let component: BoatForm;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      // Catch-all rota: save() sonrası navigate gerçek rota ağacı olmadan da eşleşsin.
      // (Component'te try/catch yok — eşleşmeyen rota testi unhandled rejection ile düşürür.)
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: '**', children: [] }]),
      ],
    });
    http = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(BoatForm);
    component = fixture.componentInstance;
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

  /**
   * Regresyon: form `novalidate` olmazsa, Signal Forms'un bastığı native
   * `required` yüzünden tarayıcı submit olayını hiç yayınlamaz — save()
   * çağrılmaz, alanlar touched olmaz ve hiçbir hata görünmez.
   */
  it('kaydet butonuna tıklamak tüm alanları touched yapar ve hataları gösterir', async () => {
    const el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();

    el.querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.boatForm.name().touched()).toBe(true);
    expect(component.boatForm.cityId().touched()).toBe(true);
    expect(el.querySelectorAll('[data-slot=field-error]').length).toBeGreaterThan(0);
  });

  it('boş form geçersizdir ve gönderimde istek atmaz', async () => {
    await component.save();

    http.expectNone((req) => req.method === 'POST');
    expect(component.boatForm().invalid()).toBe(true);
    expect(component.boatForm.name().errors()[0].kind).toBe('required');
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
      minimumRentalDuration: 1,
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
      'Bağlı olduğu liman, seçili limanlar arasında olmalı.',
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
      '0’dan büyük olmalı.',
    );
    expect(component.boatForm.totalCapacity().errors()[0].kind).toBe('min');
  });

  it('seçili limanlar arasından çıkan ana liman temizlenir', () => {
    component.model.set({ ...validModel, harborIds: [4], primaryHarborId: '3' });

    fixture.detectChanges();

    expect(component.model().primaryHarborId).toBe('');
  });

  it('liman seçenekleri seçili şehrin limanlarından üretilir', () => {
    component.model.set(validModel);

    expect(component.harborOptions()).toEqual([
      { value: 3, label: 'Bodrum Limanı' },
      { value: 4, label: 'Yalıkavak Marina' },
    ]);
  });

  it('ana liman seçenekleri yalnızca seçili limanlardan oluşur', () => {
    component.model.set({ ...validModel, harborIds: [4] });

    expect(component.primaryHarborOptions()).toEqual([
      { value: '4', label: 'Yalıkavak Marina' },
    ]);
  });

  it('şehir değişince liman seçimlerini sıfırlar', () => {
    component.model.set(validModel);

    component.onCityChange();

    expect(component.model().harborIds).toEqual([]);
    expect(component.model().primaryHarborId).toBe('');
  });
});
