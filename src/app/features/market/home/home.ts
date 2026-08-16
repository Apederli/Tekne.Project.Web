import { Component } from '@angular/core';
import { SearchTrigger } from '../search/search-trigger';

@Component({
  selector: 'app-home',
  imports: [SearchTrigger],
  template: `
    <!-- Tam genişlik: main'in max-w-8xl kabuğundan ve yan boşluğundan çıkıyor.
         Yazı bloğu aynı kabuğu içeride tekrar kurup sayfayla hizada kalıyor.
         Başlık bu sayfada saydam ve görselin üstünde duruyor (market-layout). -->
    <section class="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden">
      <img
        src="/img/hero.png"
        alt=""
        width="1672"
        height="941"
        fetchpriority="high"
        class="h-[480px] w-full object-cover object-[70%_center] sm:h-[540px] lg:h-[620px]"
      />

      <div class="absolute inset-0">
        <div
          class="mx-auto flex h-full max-w-8xl flex-col items-center justify-center gap-5 px-4 pt-24 text-center sm:px-6 lg:px-10 lg:pt-28"
        >
          <h1 class="text-3xl font-semibold text-slate-900 sm:text-4xl lg:text-5xl">
            Tekneni seç, denize açıl
          </h1>
          <p class="max-w-md text-slate-700 sm:text-lg">
            Saatlik ya da gecelik; şehrini, tarihini ve misafir sayını seç, sana uygun tekneyi bul.
          </p>

          <app-search-trigger class="block w-full max-w-xl" />
        </div>
      </div>
    </section>
  `,
})
export class Home {}
