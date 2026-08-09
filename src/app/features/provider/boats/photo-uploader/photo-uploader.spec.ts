import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BoatPhotoOutputModel } from '@models';
import { ConfirmService } from '../../../../shared/confirm-dialog/confirm.service';
import { MAX_PHOTOS } from './photo-upload-rules';
import { PhotoUploader } from './photo-uploader';

function photo(id: number, sortOrder: number): BoatPhotoOutputModel {
  return { id, url: `https://cdn.test/boat-image/${id}.jpg`, sortOrder };
}

function imageFile(name = 'a.jpg', type = 'image/jpeg', size = 1024): File {
  const f = new File(['x'], name, { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
}

describe('PhotoUploader', () => {
  let fixture: ComponentFixture<PhotoUploader>;
  let component: PhotoUploader;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConfirmService, useValue: { confirm: () => Promise.resolve(true) } },
      ],
    });
    http = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(PhotoUploader);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('boatId', 7);
    fixture.componentRef.setInput('photos', []);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function setPhotos(photos: BoatPhotoOutputModel[]): void {
    fixture.componentRef.setInput('photos', photos);
    fixture.detectChanges();
  }

  it('fotoğrafları sortOrder artan sırada dizer', () => {
    setPhotos([photo(1, 1), photo(2, 2), photo(3, 0)]);

    expect(component.visible().map((p) => p.id)).toEqual([3, 1, 2]);
  });

  it('her fotoğraf için bir kutucuk çizer', () => {
    setPhotos([photo(1, 0), photo(2, 1)]);

    expect(fixture.nativeElement.querySelectorAll('img').length).toBe(2);
  });

  it('kapak rozetini yalnızca ilk kutucukta gösterir', () => {
    setPhotos([photo(1, 0), photo(2, 1)]);

    const badges = fixture.nativeElement.querySelectorAll('[data-testid="cover-badge"]');
    expect(badges.length).toBe(1);
  });

  it('fotoğraf yokken yalnızca ekle alanı görünür', () => {
    expect(fixture.nativeElement.querySelectorAll('img').length).toBe(0);
    expect(fixture.nativeElement.querySelector('input[type="file"]')).not.toBeNull();
  });

  it('sınıra ulaşınca dosya seçiciyi gizler', () => {
    setPhotos(Array.from({ length: MAX_PHOTOS }, (_, i) => photo(i + 1, i)));

    expect(component.full()).toBe(true);
    expect(fixture.nativeElement.querySelector('input[type="file"]')).toBeNull();
  });

  it('her sil düğmesinin benzersiz erişilebilir adı vardır', () => {
    setPhotos([photo(1, 0), photo(2, 1), photo(3, 2)]);

    // Tutamaç düğmesi de hlmBtn taşıyor artık — yalnızca sil düğmelerini seç.
    const buttons = fixture.nativeElement.querySelectorAll('button[hlmBtn]:not([cdkDragHandle])');
    expect(buttons.length).toBe(3);
    expect(buttons[0].textContent).toContain('1. fotoğrafı sil');
    expect(buttons[1].textContent).toContain('2. fotoğrafı sil');
    expect(buttons[2].textContent).toContain('3. fotoğrafı sil');
  });

  it('seçilen dosyaları files alanıyla multipart olarak gönderir', () => {
    component.upload([imageFile('a.jpg'), imageFile('b.png', 'image/png')]);

    const request = http.expectOne((r) => r.method === 'POST' && r.url.endsWith('/Boats/7/photos'));
    const body = request.request.body as FormData;
    expect(body).toBeInstanceOf(FormData);
    expect(body.getAll('files').length).toBe(2);
    // Content-Type elle yazılmamalı: boundary'yi tarayıcı üretir.
    expect(request.request.headers.has('Content-Type')).toBe(false);

    request.flush([]);
  });

  it('onFileInput seçilen dosyaları yükler ve girdiyi sıfırlar', () => {
    const input = { files: [imageFile()], value: 'x' } as unknown as HTMLInputElement;

    component.onFileInput(input);

    http.expectOne((r) => r.method === 'POST' && r.url.endsWith('/Boats/7/photos')).flush([]);
    // Girdi sıfırlanmazsa aynı dosya art arda seçildiğinde `change` tetiklenmez.
    expect(input.value).toBe('');
  });

  it('onDrop bırakılan dosyaları yükler', () => {
    const event = {
      preventDefault: () => {},
      dataTransfer: { files: [imageFile()] },
    } as unknown as DragEvent;

    component.onDrop(event);

    http.expectOne((r) => r.method === 'POST' && r.url.endsWith('/Boats/7/photos')).flush([]);
  });

  it('yükleme sürerken dosya sayısı kadar iskelet gösterir', () => {
    component.upload([imageFile('a.jpg'), imageFile('b.jpg')]);
    fixture.detectChanges();

    expect(component.uploadingCount()).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('.animate-pulse').length).toBe(2);

    http.expectOne((r) => r.method === 'POST' && r.url.endsWith('/Boats/7/photos')).flush([]);
  });

  it('yanıt gelince mevcut ve yeni fotoğrafları birlikte emit eder', () => {
    setPhotos([photo(1, 0)]);
    const emitted: BoatPhotoOutputModel[][] = [];
    component.photosChanged.subscribe((list) => emitted.push(list));

    component.upload([imageFile()]);
    http
      .expectOne((r) => r.method === 'POST' && r.url.endsWith('/Boats/7/photos'))
      .flush([photo(2, 1)]);
    fixture.detectChanges();

    expect(emitted).toEqual([[photo(1, 0), photo(2, 1)]]);
    expect(component.uploadingCount()).toBe(0);
  });

  it('geçersiz dosyayı göndermez, geçerliyi gönderir ve atlananı yazar', () => {
    component.upload([imageFile('belge.pdf', 'application/pdf'), imageFile('a.jpg')]);
    fixture.detectChanges();

    const request = http.expectOne((r) => r.method === 'POST' && r.url.endsWith('/Boats/7/photos'));
    const body = request.request.body as FormData;
    expect((body.getAll('files')[0] as File).name).toBe('a.jpg');
    expect(body.getAll('files').length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('1 dosya desteklenmeyen türde');

    request.flush([]);
  });

  it('geçerli dosya kalmazsa istek açmaz', () => {
    component.upload([imageFile('belge.pdf', 'application/pdf')]);
    fixture.detectChanges();

    http.expectNone((r) => r.method === 'POST' && r.url.endsWith('/Boats/7/photos'));
    expect(component.uploadingCount()).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('1 dosya desteklenmeyen türde');
  });

  it('yükleme sürerken ikinci yükleme isteği açmaz', () => {
    component.upload([imageFile('a.jpg')]);
    component.upload([imageFile('b.jpg'), imageFile('c.jpg')]);

    expect(component.uploadingCount()).toBe(1);
    const request = http.expectOne((r) => r.method === 'POST' && r.url.endsWith('/Boats/7/photos'));
    const body = request.request.body as FormData;
    expect(body.getAll('files').length).toBe(1);
    expect((body.getAll('files')[0] as File).name).toBe('a.jpg');

    request.flush([]);
  });

  it('yükleme sürerken silme isteği açmaz', () => {
    setPhotos([photo(1, 0)]);

    component.upload([imageFile()]);
    component.remove(photo(1, 0));

    expect(component.deletingId()).toBeNull();
    http.expectNone((r) => r.method === 'DELETE' && r.url.endsWith('/Boats/7/photos/1'));

    http.expectOne((r) => r.method === 'POST' && r.url.endsWith('/Boats/7/photos')).flush([]);
  });

  it('silme sürerken yükleme isteği açmaz', () => {
    setPhotos([photo(1, 0)]);

    component.remove(photo(1, 0));
    component.upload([imageFile()]);

    expect(component.uploadingCount()).toBe(0);
    http.expectNone((r) => r.method === 'POST' && r.url.endsWith('/Boats/7/photos'));

    http.expectOne((r) => r.method === 'DELETE' && r.url.endsWith('/Boats/7/photos/1')).flush(true);
  });

  it('silme sürerken dosya seçiciyi devre dışı bırakır', () => {
    setPhotos([photo(1, 0)]);

    component.remove(photo(1, 0));
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.disabled).toBe(true);

    http.expectOne((r) => r.method === 'DELETE' && r.url.endsWith('/Boats/7/photos/1')).flush(true);
  });

  it('sınırı aşan seçimi kırparak gönderir', () => {
    setPhotos(Array.from({ length: MAX_PHOTOS - 1 }, (_, i) => photo(i + 1, i)));

    component.upload([imageFile('a.jpg'), imageFile('b.jpg'), imageFile('c.jpg')]);
    fixture.detectChanges();

    const request = http.expectOne((r) => r.method === 'POST' && r.url.endsWith('/Boats/7/photos'));
    const body = request.request.body as FormData;
    expect(body.getAll('files').length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain(`2 dosya ${MAX_PHOTOS} fotoğraf sınırını`);

    request.flush([]);
  });

  it('sil düğmesi fotoğrafı doğru uca gönderir', async () => {
    setPhotos([photo(1, 0), photo(2, 1)]);

    fixture.nativeElement.querySelectorAll('button')[0].click();
    await fixture.whenStable();

    const request = http.expectOne(
      (r) => r.method === 'DELETE' && r.url.endsWith('/Boats/7/photos/1'),
    );
    expect(request.request.method).toBe('DELETE');
    request.flush(true);
  });

  it('silme başarılıysa o fotoğrafsız listeyi emit eder', () => {
    setPhotos([photo(1, 0), photo(2, 1)]);
    const emitted: BoatPhotoOutputModel[][] = [];
    component.photosChanged.subscribe((list) => emitted.push(list));

    component.remove(photo(1, 0));
    http.expectOne((r) => r.method === 'DELETE' && r.url.endsWith('/Boats/7/photos/1')).flush(true);

    expect(emitted).toEqual([[photo(2, 1)]]);
    expect(component.deletingId()).toBeNull();
  });

  it('silme başarılı olunca atlanan mesajını temizler', () => {
    setPhotos([photo(1, 0)]);
    component.upload([imageFile('belge.pdf', 'application/pdf')]);
    fixture.detectChanges();
    expect(component.skippedMessage()).not.toBe('');

    component.remove(photo(1, 0));
    http.expectOne((r) => r.method === 'DELETE' && r.url.endsWith('/Boats/7/photos/1')).flush(true);

    expect(component.skippedMessage()).toBe('');
  });

  it('silme sürerken ikinci silme isteği açmaz', () => {
    setPhotos([photo(1, 0), photo(2, 1)]);

    component.remove(photo(1, 0));
    component.remove(photo(2, 1));

    http.expectOne((r) => r.method === 'DELETE' && r.url.endsWith('/Boats/7/photos/1')).flush(true);
    http.expectNone((r) => r.method === 'DELETE' && r.url.endsWith('/Boats/7/photos/2'));
  });

  it('yükleme hatasında iskeletleri temizler ve emit etmez', () => {
    const emitted: BoatPhotoOutputModel[][] = [];
    component.photosChanged.subscribe((list) => emitted.push(list));

    component.upload([imageFile()]);
    http
      .expectOne((r) => r.method === 'POST' && r.url.endsWith('/Boats/7/photos'))
      .flush({ message: 'Geçersiz görsel tipi.' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    expect(component.uploadingCount()).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('.animate-pulse').length).toBe(0);
    expect(emitted).toEqual([]);
  });

  it('silme hatasında kutucuğu serbest bırakır ve emit etmez', () => {
    setPhotos([photo(1, 0)]);
    const emitted: BoatPhotoOutputModel[][] = [];
    component.photosChanged.subscribe((list) => emitted.push(list));

    component.remove(photo(1, 0));
    http
      .expectOne((r) => r.method === 'DELETE' && r.url.endsWith('/Boats/7/photos/1'))
      .flush({ message: 'Fotoğraf bulunamadı.' }, { status: 404, statusText: 'Not Found' });

    expect(component.deletingId()).toBeNull();
    expect(emitted).toEqual([]);
  });

  it('hata sonrası yeniden yüklemeye izin verir', () => {
    component.upload([imageFile()]);
    http
      .expectOne((r) => r.method === 'POST' && r.url.endsWith('/Boats/7/photos'))
      .flush(null, { status: 500, statusText: 'Server Error' });

    component.upload([imageFile('b.jpg')]);
    http
      .expectOne((r) => r.method === 'POST' && r.url.endsWith('/Boats/7/photos'))
      .flush([photo(9, 0)]);

    expect(component.uploadingCount()).toBe(0);
  });
});
