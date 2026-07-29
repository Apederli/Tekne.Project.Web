import { Service, inject } from '@angular/core';
import { CDN_BASE_URL } from '../api/cdn.config';

/**
 * `objectKey` → görüntülenebilir adres.
 *
 * Uygulamada görsel adresinin kurulduğu **tek yer** burası. Sebebi: backend
 * (ve mobil istemci) ileride tam URL döndürmeye başlayabilir; o gün bu servis
 * değişir, galeri ve kartlar hiç etkilenmez.
 *
 * Prefix eklemiyor. `boat-image/` gibi klasör adları key'in kendi içinde
 * geliyor (backend `BoatPhotoCommandHandler` içinde üretiyor); burada tekrar
 * eklemek `boat-image/boat-image/...` üretirdi.
 */
@Service()
export class PhotoUrlService {
  baseUrl = inject(CDN_BASE_URL);

  /** Boş/eksik key'de boş string döner — çağıran `@if` ile ayıklar. */
  url(objectKey: string | null | undefined): string {
    if (!objectKey) return '';
    return `${trimEnd(this.baseUrl)}/${trimStart(objectKey)}`;
  }
}

function trimEnd(value: string): string {
  return value.replace(/\/+$/, '');
}

function trimStart(value: string): string {
  return value.replace(/^\/+/, '');
}
