import { Service, inject } from '@angular/core';
import { HlmDialogService } from '@ui/dialog';
import { AuthModalContext, AuthView } from '@models';
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
      // Mobile-first: tabanda tam ekran (alttan kayar), sm üstünde ortalanmış
      // kart. CDK overlay paneli içeriğe göre daraldığı için genişlik max-w
      // ile DEĞİL, belirli w ile verilir (max-w yalnız tavan olurdu ve içerik
      // o tavana hiç ulaşmazdı); taban sınıftaki max-w-[calc(100%-2rem)]
      // dar ekranda taşmayı önlemeye devam eder.
      contentClass:
        'fixed inset-0 max-w-none content-start overflow-y-auto rounded-none ' +
        'data-open:slide-in-from-bottom-8 data-closed:slide-out-to-bottom-8 ' +
        'sm:static sm:inset-auto sm:w-[42rem] sm:content-normal sm:rounded-xl sm:p-6',
    });
  }
}
