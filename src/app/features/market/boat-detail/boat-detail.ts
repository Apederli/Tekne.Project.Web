import { Component, input } from '@angular/core';

@Component({
  selector: 'app-boat-detail',
  template: `
    <h1 class="text-2xl font-semibold">Tekne detayı</h1>
    <p class="mt-3 text-slate-600">
      Galeri, özellikler, müsaitlik takvimi ve rezervasyon kutusu burada yer alacak
      (<code>{{ slug() }}</code
      >).
    </p>
  `,
})
export class BoatDetail {
  /** `withComponentInputBinding` sayesinde route parametresi doğrudan bağlanıyor. */
  slug = input.required<string>();
}
