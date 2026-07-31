# Fotoğraf galerisinin Swiper Element'e taşınması

**Tarih:** 2026-07-31
**Kapsam:** `shared/photo-gallery` bileşeninin embla tabanlı `HlmCarousel`'den Swiper.js'e geçirilmesi; görünümün teknevia kart tasarımına (alt ortada nokta sayfalama) uydurulması.

## Neden

- Ürün referansı teknevia kartı: fotoğraf üzerinde kaydırma + alt ortada nokta (bullet) sayfalama. Mevcut "1 / 8" sayacı bu tasarımda yok.
- Swiper, dokunmatik davranışı ve nokta sayfalamayı hazır veriyor; Capacitor hedefiyle uyumlu.

## Yaklaşım: Swiper Element (web component)

Swiper v9'dan beri Angular bileşeni yayınlamıyor; resmî yol `swiper/element/bundle` + `register()` (https://swiperjs.com/element).

- `register()` yalnızca tarayıcıda, `afterNextRender` içinde çağrılır — SSR'da `customElements` yok (CLAUDE.md SSR kuralı). Swiper'ın kendi `register`'ı zaten tanımlıysa tekrar tanımlamaz; bileşen başına çağrı güvenli.
- Bileşen `CUSTOM_ELEMENTS_SCHEMA` kullanır; şablonda `<swiper-container>` / `<swiper-slide>`.
- Parametreler attribute olarak verilir (`[attr.loop]`, `[attr.pagination]`): upgrade öncesi property atamasının class accessor'ı gölgeleme riskini sıfırlar.
- Nokta rengi/boyutu Swiper'ın CSS custom property'leriyle (`--swiper-pagination-*`) Tailwind arbitrary property sınıfları üzerinden ayarlanır — shadow DOM'a sızma derdi yok.

Değerlendirilip elenen: Swiper core JS API (`new Swiper(el, ...)`) — yaşam döngüsü, slayt değişimi gözlemi ve stil enjeksiyonu elle yönetilecekti; Element bunları kendi hallediyor.

## Tasarım kararları (ekran görüntüsündeki kart)

- **Nokta sayfalama** alt ortada, tıklanabilir; beyaz, pasifler yarı saydam. Sayaç (`hlm-carousel-slide-display`) kalkıyor.
- **Oklar mobilde yok** — kaydırma + nokta yeterli (mobile-first). `sm:`'den itibaren görünürler; dokunmatikte kaybolan bir yetenek yok, kaydırma aynı işi yapıyor.
- Tek fotoğrafta ok/nokta/loop yok (mevcut davranış korunuyor).
- Dış API aynen kalıyor: `photos`, `alt`, `class` girdileri ve overlay için `ng-content`. Çağrı yerleri değişmiyor.

## Temizlik

- `embla-carousel`, `embla-carousel-angular` paketleri ve `src/app/shared/ui/carousel` (+ tsconfig `@ui/carousel` yolu) kaldırılır — tek kullanıcıları bu galeriydi.

## Test

Mevcut spec korunur; sayaç iddiası nokta sayfalamaya uyarlanır. Swiper shadow DOM'u jsdom'da upgrade edilmediğinden testler Angular'ın render ettiği light DOM üzerinden doğrular (placeholder, sıralama, CDN URL, alt metni, eager/lazy, ok görünürlüğü).
