import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BoatPhotoOutputModel } from '@models';
import { CDN_BASE_URL } from '../../core/api/cdn.config';
import { PhotoGallery } from './photo-gallery';

const CDN = 'https://cdn.test';

function photo(
  id: number,
  sortOrder: number,
  isMain = false,
): BoatPhotoOutputModel {
  return { id, objectKey: `boat-image/${id}.webp`, isMain, sortOrder };
}

describe('PhotoGallery', () => {
  let fixture: ComponentFixture<PhotoGallery>;

  function create(photos: BoatPhotoOutputModel[], alt = '') {
    TestBed.configureTestingModule({
      providers: [{ provide: CDN_BASE_URL, useValue: CDN }],
    });

    fixture = TestBed.createComponent(PhotoGallery);
    fixture.componentRef.setInput('photos', photos);
    fixture.componentRef.setInput('alt', alt);
    fixture.detectChanges();
  }

  function images(): HTMLImageElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('img'));
  }

  it('shows a placeholder and no carousel when there are no photos', () => {
    create([]);

    expect(images().length).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('Fotoğraf yok');
  });

  it('hides arrows and the counter for a single photo', () => {
    create([photo(1, 0, true)]);

    expect(images().length).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('button').length).toBe(0);
    expect(fixture.nativeElement.querySelector('hlm-carousel-slide-display')).toBeNull();
  });

  it('renders arrows and the counter for multiple photos', () => {
    create([photo(1, 0, true), photo(2, 1)]);

    expect(fixture.nativeElement.querySelectorAll('button').length).toBe(2);
    expect(fixture.nativeElement.querySelector('hlm-carousel-slide-display')).not.toBeNull();
  });

  it('puts the main photo first, then orders by sortOrder', () => {
    create([photo(1, 0), photo(2, 1), photo(3, 2, true)]);

    expect(fixture.componentInstance.visible().map((p) => p.id)).toEqual([3, 1, 2]);
  });

  it('builds the src from the CDN token without duplicating the key prefix', () => {
    create([photo(7, 0, true)]);

    expect(images()[0].getAttribute('src')).toBe(`${CDN}/boat-image/7.webp`);
  });

  it('describes the boat and the position in the alt text', () => {
    create([photo(1, 0, true), photo(2, 1)], 'Ayla');

    expect(images()[0].getAttribute('alt')).toBe('Ayla — fotoğraf 1 / 2');
  });

  it('loads the first photo eagerly and the rest lazily', () => {
    create([photo(1, 0, true), photo(2, 1)]);

    expect(images()[0].getAttribute('loading')).toBe('eager');
    expect(images()[1].getAttribute('loading')).toBe('lazy');
  });
});
