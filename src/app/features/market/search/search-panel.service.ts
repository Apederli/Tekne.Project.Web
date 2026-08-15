import { Service, inject } from '@angular/core';
import { HlmDialogService } from '@ui/dialog';
import { RESPONSIVE_DIALOG_CLASS } from '../../../shared/responsive-dialog';
import { SearchPanel } from './search-panel';

@Service()
export class SearchPanelService {
  dialogService = inject(HlmDialogService);

  open(): void {
    this.dialogService.open(SearchPanel, {
      contentClass: `${RESPONSIVE_DIALOG_CLASS} sm:w-[34rem]`,
    });
  }
}
