import { Service, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HlmDialogService } from '@ui/dialog';
import { ConfirmOptions } from '@models';
import { ConfirmDialog } from './confirm-dialog';

/**
 * Yıkıcı işlemler için onay: `await confirm(...)` yalnızca kullanıcı Onay
 * butonuna bastıysa `true` döner. Vazgeç, backdrop ve Escape `false` —
 * "kazayla evet" imkânsız, "kazayla hayır" zararsız.
 *
 * `@services` barrel'ında DEĞİL: bileşene referans veren servis barrel'a
 * girerse dialog helm'i barrel'ı import eden herkese bulaşır.
 */
@Service()
export class ConfirmService {
  dialogService = inject(HlmDialogService);

  async confirm(options: ConfirmOptions): Promise<boolean> {
    const ref = this.dialogService.open<boolean, ConfirmOptions>(ConfirmDialog, {
      context: options,
      showCloseButton: false,
      // Ekran okuyucu başlığı ve "geri alınamaz" uyarısını açılışta okusun.
      role: 'alertdialog',
      // Genişlik kullanıcı kararı (2026-08-01): masaüstünde 32rem, telefonda
      // kenarlardan 1rem boşluk. Helm'in max-w sınırları bilinçli eziliyor —
      // width'teki min() taşmayı zaten engelliyor.
      contentClass: 'w-[min(32rem,calc(100vw-2rem))] max-w-none sm:max-w-none',
    });
    const result = await firstValueFrom(ref.closed$);
    return result === true;
  }
}
