import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

// jsdom Swiper'ın shadow DOM render'ını taşıyamıyor (connectedCallback fırlatıyor);
// custom element hiç tanımlanmasın — testler Angular'ın render ettiği light DOM'u doğruluyor.
vi.mock('swiper/element/bundle', () => ({ register: () => {} }));
import { PhotoGallery } from './photo-gallery';

const CDN = 'https://cdn.test';

function photo(id: number): string {
  return `${CDN}/boat-image/${id}.webp`;
}

describe('PhotoGallery', () => {
  let fixture: ComponentFixture<PhotoGallery>;

  function create(photos: string[], alt = '') {
    TestBed.configureTestingModule({});

    fixture = TestBed.createComponent(PhotoGallery);
    fixture.componentRef.setInput('photos', photos);
    fixture.componentRef.setInput('alt', alt);
    fixture.detectChanges();
  }

  function images(): HTMLImageElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('img'));
  }

  function swiper(): HTMLElement | null {
    return fixture.nativeElement.querySelector('swiper-container');
  }

  it('shows a placeholder and no swiper when there are no photos', () => {
    create([]);

    expect(images().length).toBe(0);
    expect(swiper()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Fotoğraf yok');
  });

  it('disables pagination dots and rewind for a single photo', () => {
    create([photo(1)]);

    expect(images().length).toBe(1);
    expect(swiper()!.getAttribute('pagination')).toBe('false');
    expect(swiper()!.getAttribute('rewind')).toBe('false');
  });

  it('enables dynamic pagination dots and rewind for multiple photos', () => {
    create([photo(1), photo(2)]);

    expect(swiper()!.getAttribute('pagination')).toBe('true');
    expect(swiper()!.getAttribute('rewind')).toBe('true');
    expect(swiper()!.getAttribute('pagination-dynamic-bullets')).toBe('true');
    // Ok düğmesi bilinçli yok — gezinme kaydırma + noktalarla (teknevia kalıbı).
    expect(fixture.nativeElement.querySelectorAll('button').length).toBe(0);
  });

  it('renders photos in the given order — ordering is the callers contract', () => {
    create([photo(3), photo(1), photo(2)]);

    expect(images().map((img) => img.getAttribute('src'))).toEqual([
      `${CDN}/boat-image/3.webp`,
      `${CDN}/boat-image/1.webp`,
      `${CDN}/boat-image/2.webp`,
    ]);
  });

  it('uses the given URL as the image src untouched', () => {
    create([photo(7)]);

    expect(images()[0].getAttribute('src')).toBe(`${CDN}/boat-image/7.webp`);
  });

  it('describes the boat and the position in the alt text', () => {
    create([photo(1), photo(2)], 'Ayla');

    expect(images()[0].getAttribute('alt')).toBe('Ayla — fotoğraf 1 / 2');
  });

  it('loads the first photo eagerly and the rest lazily', () => {
    create([photo(1), photo(2)]);

    expect(images()[0].getAttribute('loading')).toBe('eager');
    expect(images()[1].getAttribute('loading')).toBe('lazy');
  });
});
