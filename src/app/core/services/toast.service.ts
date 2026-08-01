import { PLATFORM_ID, Service, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Kısa ömürlü ekran bildirimi (toast) sarmalayıcısı.
 *
 * Ad bilinçli olarak "Toast": `Notification*` isim alanı ileride push
 * bildirimi / bildirim merkezi için saklanıyor (2026-08-01 kararı).
 *
 * SSR'da üç metot da sessiz no-op — sunucuda gösterilecek ekran yok,
 * çağıran taraf platform düşünmek zorunda kalmasın.
 *
 * `@spartan-ng/brain/sonner` burada dinamik import ile yükleniyor: statik
 * import bu servisi (dolayısıyla onu import eden herkesi, `@services`
 * barrel'ı üzerinden) initial bundle'a sokuyor ve prerender edilen anasayfa
 * dahil her sayfada sonner'ı eagerly yüklüyordu — 500 kB `initial` budget'ı
 * aşılıyordu (2026-08-01 code review bulgusu).
 */
@Service()
export class ToastService {
  isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  async error(message: string): Promise<void> {
    if (!this.isBrowser) return;
    const { toast } = await import('@spartan-ng/brain/sonner');
    toast.error(message);
  }

  async success(message: string): Promise<void> {
    if (!this.isBrowser) return;
    const { toast } = await import('@spartan-ng/brain/sonner');
    toast.success(message);
  }

  async info(message: string): Promise<void> {
    if (!this.isBrowser) return;
    const { toast } = await import('@spartan-ng/brain/sonner');
    toast.info(message);
  }
}
