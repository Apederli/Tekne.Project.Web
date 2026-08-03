# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proje

**Tekne** — tekne kiralama pazar yerinin frontend'i (teknevia.com benzeri). Angular 22, hybrid rendering (SSR + SSG + CSR), Tailwind CSS v4.

> **Durum: iskelet aşaması.** Route ağacı, layout'lar ve rol guard'ı kurulu; sayfaların tamamı placeholder ve backend'e hiç bağlanmadı. `AuthStore` yalnızca bellekte çalışıyor, `API_BASE_URL` bir yer tutucu. Bir özelliğe başlarken ilgili altyapının gerçekten bağlı olup olmadığını önce kontrol et.

## Komutlar

```bash
npm start                      # ng serve — http://localhost:4200
npm run build                  # dist/tekne-web (browser + server bundle)
npm test -- --watch=false      # Vitest, jsdom ortamında

npx ng test --filter "^App"                        # test/suite adına regex ile tek test
npx ng test --include src/app/features/market      # dizine/dosyaya göre

npm run serve:ssr:tekne-web    # build sonrası SSR sunucusu — http://localhost:4000
```

Testler Vitest ile koşuyor (Karma değil). `--filter` test **adına**, `--include` **dosya yoluna** göre daraltır.

## Backend

`D:\Tekne\Tekne.Project.Api` — ASP.NET Core 10, CQRS + MediatR, EF Core / PostgreSQL.

API lokalde `http://localhost:5188` üzerinde koşuyor; Swagger UI `http://localhost:5188/swagger/index.html`, ham şema ise `http://localhost:5188/swagger/v1/swagger.json` (model yazarken okunacak dosya budur — UI sayfası değil).

Kendi `CLAUDE.md`'si var ve iş modelini (aktörler, konum hiyerarşisi, rezervasyon akışı) orası tanımlıyor. **Domain sorularında kaynak orasıdır**, burada tahmin yürütme.

İki noktaya dikkat:

- **Terminoloji farkı:** backend'de tekne sahibi **`Partner`**, bu projenin kodunda **`provider`** (URL'i ise `/partner`). API modelleri karşılanırken bu eşleme bilinçli yapılmalı.
- **Konum modeli:** `City` → `Harbor` hiyerarşisi. Bir tekne tek bir şehirde hizmet verir, o şehrin birden çok limanından kalkabilir; `PrimaryHarborId` teknenin bağlı olduğu ana noktadır ve listelemede gösterilen konumdur.

## Arayüz: mobile-first

**Ekranlar önce mobil için tasarlanır**, masaüstü genişleme olarak eklenir. Tailwind'de bu, taban sınıfların mobil düzeni tarif etmesi ve `sm:` / `md:` / `lg:` ön eklerinin yalnızca büyütme yönünde kullanılması demektir — masaüstü düzeni yazıp `sm:` ile daraltmak değil.

Sebebi ürün kararı: ziyaretçilerin çoğu siteyi telefonda açacak — market tarafı ağırlıklı olarak mobilde kullanılacak ve SEO trafiği de oraya inecek. Bu gerekçe mobil uygulamadan bağımsızdır; web'in kendisi mobil bir üründür. Dokunmatik hedefler parmakla basılabilir boyutta olmalı, yalnızca hover ile erişilen (masaüstünde görünüp dokunmatikte kaybolan) etkileşim bırakılmamalı.

Mobil uygulama ayrı bir **React Native** projesi olarak yazılacak; web Angular kalıyor ve RN onu ikame etmiyor, yanına geliyor. **Capacitor** kapalı bir kapı değil — mevcut web'i bir cihazda hızlıca denemek için ucuz bir deney olarak durabilir; ama bugünden ona göre kod yazma, kurulu da değil. Native plugin'lere bağımlılık kurma.

## Mimari

Tek Angular uygulaması, üç erişim alanı. Ayrı uygulamalara bölünmedi çünkü Angular render modunu **route bazında** seçebiliyor:

| Alan | Route kökü | Erişim | Render |
|---|---|---|---|
| market | `/` | herkese açık | anasayfa SSG, listeleme/detay SSR, oturum sayfaları CSR |
| admin | `/admin` | `roleGuard('admin')` | tamamen CSR |
| provider | `/partner` | `roleGuard('provider')` | tamamen CSR |

Provider alanının **URL'i `/partner`, kodu `provider`** — backend `Partner` dediği için adres çubuğu ona uyduruldu, klasör/sınıf/rol adları henüz çevrilmedi. Yeni link yazarken URL tarafında `partner` kullan.

Her alan kendi `*.routes.ts` dosyasından lazy yükleniyor ve kendi layout'una sarılıyor.

### Route eklerken uyulması gerekenler

1. **`app.routes.ts` içindeki sıra anlamlı.** `admin` ve `partner`, market'in `path: ''` girdisinden **önce** gelmeli — aksi hâlde `''` prefix eşleşmesi onları yutar.

2. **`app.routes.server.ts` ile birlikte güncelle.** Sondaki `**` girdisi her şeyi `RenderMode.Server`'a düşürür; yeni route'un render modunu bilinçli yazmazsan sessizce SSR olur.

   **URL segmentlerini `src/app/core/routes.const.ts`'e yaz, string literal kullanma.** Aynı segment `*.routes.ts`, layout `routerLink`'leri ve `app.routes.server.ts` olmak üzere üç yerde geçiyor; sabitler bunların ayrışmasını engelliyor. Alan başına ayrı obje: `ROUTE_MARKET`, `ROUTE_ADMIN`, `ROUTE_PARTNER`.

3. **Oturuma bağlı her sayfa `RenderMode.Client`.** Sunucu render'ı sırasında kullanıcı oturumu yok; kişiye özel içeriği SSR'a bırakmak hydration uyuşmazlığı ve yanlış içerik cache'lenmesi üretir. Prerender edilen sayfalar için bu daha da kritik — çıktı tüm ziyaretçilere aynı dosya olarak servis edilir.

4. **Rol kontrolü `canMatch` ile**, `canActivate` ile değil. `canMatch` başarısız olduğunda Angular o route'un lazy chunk'ını hiç indirmez.

### Klasör düzeni

`features/` altında **erişim alanına** göre bölünmüş, alanların içinde feature klasörleri var. Angular'ın style guide'ı tipe göre klasör açmayı (`components/`, `services/`) önermiyor — `core/` ve `shared/` bu kuralın bilinçli istisnası ve ikisi de **ince tutulmalı**: bir şey tek bir alana aitse o alanın klasöründe kalır.

## Modeller

**Interface ve model tipleri bileşen dosyalarının içinde tanımlanmaz.** Hepsi `src/app/core/models/` altında, konu başına bir dosyada yaşar (`auth.ts`, `boat.ts`, `reservation.ts` …).

**Kaynak Swagger'dır.** Alan adları, tipler ve zorunluluklar backend'in Swagger şemasından doğrulanarak yazılır — tahminle veya UI'ın ihtiyacına göre değil. Şema `D:\Tekne\Tekne.Project.Api` tarafından üretiliyor.

İsimlendirme, istek/yanıt ayrımını taşır:

```ts
export interface PartnerLoginInputModel {   // request gövdesi
  email: string;
  password: string;
}

export interface PartnerLoginOutputModel {  // response gövdesi
  accessToken: string;
}
```

Bir bileşende `interface` görürsen yanlış yerdedir; `core/models/` altına taşı.

Kod üretme aracı (ng-openapi-gen, NSwag vb.) kurulu değil — modeller elle yazılıyor. Swagger büyüdüğünde codegen değerlendirilebilir, ama şu an konvansiyon elle yazmak.

## Angular 22 konvansiyonları

Bu sürümde değişmiş, kolayca eskisi gibi yazılan noktalar:

- `standalone: true` **yazma** — v20+ varsayılanı.
- `changeDetection: OnPush` **yazma** — v22+ varsayılanı.
- Yeni singleton servislerde `@Service()` kullan, `@Injectable({providedIn: 'root'})` değil.
- `input()` / `output()` fonksiyonları; `@Input()` / `@Output()` dekoratörleri değil.
- Constructor injection yerine `inject()`.
- `@if` / `@for` / `@switch`; `*ngIf` / `*ngFor` yok.
- `ngClass` / `ngStyle` yerine `class` / `style` binding.
- `@HostBinding` / `@HostListener` yerine dekoratördeki `host` objesi.
- Yeni formlarda Signal Forms (`@angular/forms/signals`); olmuyorsa Reactive Forms.
- **Bileşen ve servislerde erişim belirteci yazma.** `private readonly router = inject(Router)` değil, düz `router = inject(Router)`. `private` / `protected` / `public` ve `readonly` kullanılmıyor — üyeler sade bırakılır.
- Durum için signal; türetilmiş değerler için `computed()`.

Bu liste Angular MCP'nin `get_best_practices` çıktısından geliyor — emin olmadığında oradan veya `search_documentation`'dan doğrula, ezberden yazma.

## Tailwind v4

Tailwind **CSS-first** yapılandırılıyor: `tailwind.config.js` **yok ve olmayacak**. Tema özelleştirmesi `src/tailwind.css` içinde `@theme` bloğuyla yapılır.

`angular.json` içindeki `styles` sırası anlamlı: `src/tailwind.css` önce, `src/styles.scss` sonra.

## SSR'da dikkat

- `window`, `document`, `localStorage` gibi tarayıcı global'lerine doğrudan dokunma. Tarayıcıya özel başlatma için `afterNextRender`, DOM erişimi için `DOCUMENT` token'ı.
- Template içinde `isPlatformBrowser` ile farklı içerik render etme — hydration uyuşmazlığı üretir.
- `src/server.ts` sıradan bir Express uygulaması; API proxy'si veya host bazlı davranış gerekirse yeri orası.
