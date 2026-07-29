import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Görsel kökü (R2 bucket'ın public adresi).
 *
 * `API_BASE_URL` ile aynı deseni izliyor: varsayılan ortam dosyasından gelir,
 * token olarak durur ki SSR'da sunucu bundle'ı gerekirse farklı bir adres
 * kullanabilsin.
 *
 * Backend fotoğraf kaydında yalnızca `objectKey` tutuyor (`PublicUrl` alanı
 * `RemoveBoatPhotoPublicUrl` migration'ı ile kaldırıldı), tam adresi istemci
 * üretiyor. Bu token'ı doğrudan okumak yerine `PhotoUrlService` kullan —
 * backend ileride tam URL döndürmeye başlarsa değişecek tek yer orası.
 */
export const CDN_BASE_URL = new InjectionToken<string>('CDN_BASE_URL', {
  providedIn: 'root',
  factory: () => environment.cdnBaseUrl,
});
