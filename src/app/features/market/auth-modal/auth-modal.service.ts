import { Service, inject } from '@angular/core';
import { HlmDialogService } from '@ui/dialog';
import { AuthModalContext, AuthView } from '@models';
import { AuthModal } from './auth-modal';

/**
 * Giriş/kayıt modalını açan tek nokta — masaüstü menü ve mobil sekme
 * bileşenleri (ileride rezervasyon akışı) bunu çağırır.
 *
 * `@services` barrel'ında DEĞİL: bileşene referans veren servis barrel'a
 * girerse dialog helm'i barrel'ı import eden herkese bulaşır
 * (`ConfirmService` kuralının aynısı). Tüketici doğrudan dosyadan import eder.
 */
@Service()
export class AuthModalService {
  dialogService = inject(HlmDialogService);

  open(view: AuthView): void {
    this.dialogService.open(AuthModal, {
      // $showCloseButton: helm content'in hazır X'i kapalı — kapatma düğmesini
      // modalın kendi başlık şeridi çiziyor (geri okuyla hizalı dursun diye).
      context: { view, $showCloseButton: false } satisfies AuthModalContext & {
        $showCloseButton: boolean;
      },
      // Mobile-first: tabanda tam ekran (alttan kayar), sm üstünde ortalanmış
      // kart. contentClass, helm varsayılanlarının üzerine tailwind-merge ile
      // biner — max-w/rounded çakışmalarında buradaki kazanır.
      contentClass:
        'fixed inset-0 max-w-none content-start overflow-y-auto rounded-none ' +
        'data-open:slide-in-from-bottom-8 data-closed:slide-out-to-bottom-8 ' +
        'sm:static sm:inset-auto sm:max-w-lg sm:content-normal sm:rounded-xl sm:p-6',
    });
  }
}
