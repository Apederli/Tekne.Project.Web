import { Service, inject } from '@angular/core';
import { HlmDialogService } from '@ui/dialog';
import { AuthModalContext, AuthView } from '@models';
import { RESPONSIVE_DIALOG_CLASS } from '../../../shared/responsive-dialog';
import { AuthModal } from './auth-modal';

@Service()
export class AuthModalService {
  dialogService = inject(HlmDialogService);

  open(view: AuthView): void {
    this.dialogService.open(AuthModal, {
      context: { view } satisfies AuthModalContext,
      // Helm content'in hazır X'i kapalı — kapatma düğmesini modalın kendi
      // başlık şeridi çiziyor (geri okuyla hizalı dursun diye).
      showCloseButton: false,
      // Genel dialog perdesi şeffaf; oturum modalı odak istediği için istisna —
      // arka sayfa görünür kalacak kadar hafif bir karartma.
      backdropClass: 'bg-black/20',
      contentClass: `${RESPONSIVE_DIALOG_CLASS} sm:w-[42rem]`,
    });
  }
}
