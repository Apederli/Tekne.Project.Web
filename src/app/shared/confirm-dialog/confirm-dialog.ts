import { Component, inject } from '@angular/core';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@ui/button';
import { HlmDialogDescription, HlmDialogFooter, HlmDialogHeader, HlmDialogTitle } from '@ui/dialog';
import { ConfirmOptions } from '@models';

/**
 * `ConfirmService`in açtığı onay içeriği. Tek başına kullanılmaz: context'i
 * servis verir, sonuç `ref.close(boolean)` ile döner. Yalnızca Onay butonu
 * `true` üretir — Vazgeç/backdrop/Escape `false` sayılır (serviste normalize).
 */
@Component({
  selector: 'app-confirm-dialog',
  imports: [HlmButton, HlmDialogDescription, HlmDialogFooter, HlmDialogHeader, HlmDialogTitle],
  templateUrl: './confirm-dialog.html',
})
export class ConfirmDialog {
  ref = inject<BrnDialogRef<boolean>>(BrnDialogRef);
  options = injectBrnDialogContext<ConfirmOptions>();
}
