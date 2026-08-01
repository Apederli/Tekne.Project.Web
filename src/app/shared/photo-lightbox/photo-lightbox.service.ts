import { inject, Service } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { BoatPhotoOutputModel, PhotoLightboxData } from '@models';
import { PhotoLightbox } from './photo-lightbox';

/**
 * Lightbox'ı açan tek kapı. `HlmDialogService` değil CDK `Dialog`:
 * Helm içeriği kart görünümlü `HlmDialogContent`'e sarıyor (bg-popover, p-4,
 * rounded-xl, max-w-*) — tam ekran siyah yüzey bunların hepsini ezmek zorunda
 * kalırdı. CDK kabı görsel olarak boş ama davranışı tam: odak tuzağı, kapanışta
 * odak geri dönüşü, Escape, kaydırma kilidi, aria rolleri.
 *
 * `@services` barrel'ında DEĞİL (confirm-dialog kuralı): bileşene referans
 * veren servis barrel'a girerse bileşen bağımlılığı barrel'ı import eden
 * herkese bulaşır.
 */
@Service()
export class PhotoLightboxService {
  dialog = inject(Dialog);

  open(photos: BoatPhotoOutputModel[], startIndex: number, alt: string): void {
    this.dialog.open<void, PhotoLightboxData>(PhotoLightbox, {
      data: { photos, startIndex, alt },
      ariaLabel: alt.trim() ? `${alt} fotoğrafları` : 'Fotoğraflar',
    });
  }
}
