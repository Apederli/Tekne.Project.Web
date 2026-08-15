import { Service, inject } from '@angular/core';
import { HlmDialogService } from '@ui/dialog';
import { SearchPanel } from './search-panel';

/**
 * Arama panelini açar. Kabuk `auth-modal.service.ts`'teki desenin aynısı:
 * tek dialog, sunum farkını responsive panel sınıfları taşıyor — mobilde tam
 * ekran, sm üstünde ortalanmış kutu. Breakpoint gözlemcisi yok, SSR'da
 * dallanma yok.
 */
@Service()
export class SearchPanelService {
  dialogService = inject(HlmDialogService);

  open(): void {
    this.dialogService.open(SearchPanel, {
      // Genel dialog perdesi saydam (ürün kararı); auth modalinin karartması
      // istisnaydı, arama paneli genel kurala uyar.
      contentClass:
        'fixed inset-0 max-w-none content-start overflow-y-auto rounded-none ' +
        'data-open:slide-in-from-bottom-8 data-closed:slide-out-to-bottom-8 ' +
        'sm:static sm:inset-auto sm:max-w-none sm:w-[34rem] sm:content-normal sm:rounded-xl sm:p-6',
    });
  }
}
