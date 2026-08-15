# Market arama paneli — Tasarım

**Tarih:** 2026-08-15
**Kapsam:** Market başlığındaki arama pill'inin gerçek bir panele dönüşmesi ve
`/tekneler` listesinin bu aramayla filtrelenmesi. Saatlik kiralama için.

## Amaç

Başlıktaki arama çubuğu bugün görsel bir yer tutucu — tıklanmıyor, hiçbir şey
toplamıyor. Liste ise filtresiz: tüm ilanlar `Id DESC` sırayla geliyor.
`BoatListFilterInputModel` ve `BoatService.getList` filtreyi taşıyor ama hiçbir
ekran doldurmuyor.

Bu iş paneli kurar, topladığı filtreyi `/tekneler`'in query string'ine yazar ve
listeyi oradan besler.

## Bulgular — backend bugün ne yapıyor

`BoatQueryHandler.Handle` (`GetBoatListQuery`) yalnızca **üç** alanla sonuç
kümesini daraltıyor:

| Alan | Etki |
|---|---|
| `HarborId` | `b.Harbors.Any(h => h.HarborId == harborId)` |
| `NumberOfPeople` | `b.TotalCapacity >= people` |
| `RentalType` | `b.RentalType == rentalType` |

`Date`, `StartHour`, `Hours` sonuç kümesine **dokunmuyor** — yalnızca
`ResolveRate`'e gidip kartta gösterilen ücreti o zaman dilimine göre
hesaplıyor. Müsaitlik takvimi backend'de tasarlanmış
(`2026-08-10-musaitlik-takvimi-design.md`) ama kodda `Availability` diye bir şey
yok; yazılmamış.

Bunun tasarıma etkisi: panel tarih/saat sorar ama **"müsait tekneler" vaadi
verilmez**. Metinler "seçtiğin zamana göre fiyat" dilinde kurulur. Müsaitlik
filtresi backend'e geldiğinde daraltma kendiliğinden devreye girer; panel
değişmez.

İki yan kısıt:

- **Şehir filtresi yok.** Filtre tek bir `HarborId` alıyor. Şehir seçimi bu iş
  kapsamında API'ye eklenecek (aşağıda).
- **`HourlyMaxHours` (12) istemciye açık değil.** Yalnız `appsettings.json`'da
  ve validator'da. İstemcide sabit yazılır.

## Kararlar (kullanıcıyla netleşti)

| Konu | Karar |
|---|---|
| Zaman girdileri | Panel tarih/saat/süre toplar; bunlar **fiyatı** belirler, sonucu daraltmaz. Dil buna göre kurulur. |
| Konum seviyesi | Şehir üst düzey, limanlar altında. Şehre tıklayan o şehrin tamamını, limana tıklayan tek limanı alır. |
| Kiralama tipi | Şimdilik yalnız **saatlik**. Panelde tip seçici yok; `rentalType` sabit `Hourly` gider. Tip seçimi ileride kullanıcı tarafından belirlenecek. |
| Sunum | Tek panel, iki kabuk: mobilde tam ekran, `sm:`'de ortada kutu. Airbnb tarzı yerinde açılan çubuk **elendi** (maliyeti orantısız, iskelet aşamasında erken). |
| URL dili | İngilizce (`?city=`, `?date=`…). Shipped `?sayfa=` de `?page=`'e çevrilir — tek konvansiyon kalsın. |
| `cityId` | API değişikliği bu işin parçası. |

## URL sözleşmesi

Panel durum tutmaz. "Ara" dediğinde `/tekneler`'e navigate eder; liste URL'i
okur. `?page=` ile aynı desen: SSR sunucuda okur, paylaşılan link aynı sonucu
verir, geri tuşu çalışır.

| Query param | API alanı | Aralık / biçim |
|---|---|---|
| `city` | `cityId` | pozitif tam sayı |
| `harbor` | `harborId` | pozitif tam sayı |
| `date` | `date` | `YYYY-MM-DD` (`DateOnly`) |
| `startHour` | `startHour` | 0–23 |
| `hours` | `hours` | 1–12 |
| `people` | `numberOfPeople` | pozitif tam sayı |
| `page` | `pageNumber` | pozitif tam sayı |
| — | `rentalType` | istemcide sabit `Hourly` |

`city` ve `harbor` birbirini dışlar: kullanıcı ya şehri ya tek limanı seçer,
ikisi birden yazılmaz. Elle yazılmış URL ikisini birden taşıyorsa `harbor`
kazanır — daha dar olan kastedilmiştir.

Geçmiş tarih ayrıştırmada düşürülmez, olduğu gibi geçer: backend kabul ediyor
(yalnız fiyat hesaplıyor) ve düşürmek paylaşılan bir linki sessizce başka bir
aramaya çevirirdi. `min bugün` kısıtı yalnız panelde **yeni** seçimi bağlar.

**Ayrıştırma tek yerde:** `core/util/boat-search-params.ts`.

```ts
parseSearchParams(map: ParamMap): BoatListFilterInputModel
toQueryParams(filter: BoatListFilterInputModel): Params
```

Bozuk değer (`?people=abc`, `?startHour=99`) sessizce düşer — elle yazılmış URL
bozuk ekran değil, o alanı yok sayılmış bir arama üretir. `toQueryParams` boş
alanları `null` yazar ki `queryParamsHandling: 'merge'` ile URL'den silinsinler.

**Filtre değişince `page` düşer.** Yeni arama 1. sayfadan başlar; yoksa
`?page=5` ile iki sonuçlu bir aramada boş ekran çıkar.

## Mimari

```
features/market/search/
  search-trigger.ts        başlıktaki pill: özet metin + paneli açar
  search-panel.ts / .html  form; "Ara" → /tekneler?...
  search-panel.service.ts  paneli açar (HlmDialogService sarmalayıcısı)
shared/forms/app-stepper.ts    "− 4 saat +" / "− 6 kişi +"
core/util/boat-search-params.ts
```

`features/market/search/` çünkü panel market alanına ait ve başlıktan
açılıyor — tek alana ait olan o alanın klasöründe kalır.

**Kabuk için yeni mekanizma yok.** `auth-modal.service.ts` "mobilde tam ekran,
`sm:`'de ortada kutu"yu tek `HlmDialogService` çağrısı + responsive panel
sınıflarıyla çözüyor; aynı desen kullanılır. Breakpoint gözlemcisi yok, SSR'da
dallanma yok. Perde saydam (karartma yalnız auth modalinde).

**`search-trigger`** layout'taki statik pill'in yerine geçer. Market'in her
sayfasında durur; kapalıyken aktif filtreleri özetler ("12 Eyl · 10:00 · 4
saat · 6 kişi"), filtre yoksa bugünkü yer tutucu metni gösterir. Özeti URL'den
türetir — kendi durumu yoktur.

Özet **yer adı taşımaz** (uygulama sırasında verilen karar): pill her market
sayfasında sunucuda render ediliyor; id'yi ada çevirmek her SSR render'ına bir
liman isteği ekler, istemcide geç çözmek ise hydration uyuşmazlığı üretirdi.
Konum seçiliyken özet "Seçili konum" der; ad gösterimi ileride paylaşılan
önbellekli bir liman servisiyle eklenebilir.

**`app-stepper`** `shared/forms` altında, `app-amount-input` ailesiyle aynı
konvansiyonda: `min`/`max`/`step` input'ları, `−`/`+` butonları 44px dokunma
hedefi. Panelde iki kez kullanılır (süre, misafir).

## Panel içeriği

| Alan | Bileşen | Not |
|---|---|---|
| Konum | `combobox` | Aranabilir. `GET /api/Harbors` şehirleri limanları gömülü döndüğü için tek istek. Şehirler üst düzey, limanlar girintili; tek seçim. Seçim değeri `city:3` / `harbor:7` biçiminde kodlanır — iki farklı kimlik uzayı tek bir combobox değerinde taşınıyor, çıplak sayı hangisi olduğunu söylemezdi. |
| Tarih | inline `hlm-calendar` | Min bugün. Uygulama sırasında değişti: panel zaten dialog olduğundan popover'lı `date-picker` yerine takvim doğrudan gömülü. Türkçe (`provideBrnCalendarI18n`), hafta Pazartesi başlar. |
| Başlangıç saati | `hour-picker` (takvimin yanında) | Kullanıcı isteğiyle `app-select` yerine dikey saat sütunu: 00:00–23:00, satır başına ikon — 08:00–19:00 güneş, 20:00–07:00 ay. Bugün seçiliyken geçmiş saatler pasif; seçili saate tekrar tıklamak seçimi kaldırır. Mobilde takvimin altına iner. |
| Süre | `app-stepper` | 1–12 saat. |
| Misafir | `app-stepper` | 1'den başlar, üst sınır yok — backend de sınır koymuyor, en büyük teknenin kapasitesi doğal tavan. |

**Zincir kuralı UI'da görünür.** Backend `Date` olmadan `StartHour`,
`StartHour` olmadan `Hours` kabul etmiyor (`BoatValidators`). Panel bunu
dayatır: tarih seçilmeden saat, saat seçilmeden süre pasif. Böylece kullanıcı
reddedilecek bir kombinasyonu hiç kuramaz.

Altta iki eylem: **Ara** (URL'e yazar, paneli kapatır) ve **Temizle** (alanları
boşaltır; URL'e ancak "Ara" ile yansır).

## Liste tarafı

`BoatSearch` bugün `?sayfa=` input'unu okuyor. Bu, `parseSearchParams` üzerinden
tüm filtreyi okuyan tek bir kaynağa dönüşür — yedi ayrı string input'u tek tek
doğrulamak yerine ayrıştırma ve doğrulama tek yerde kalır.

Boş sonuç metni ikiye ayrılır: filtre varsa "Aramana uygun tekne bulunamadı" +
**Filtreleri temizle**; filtre yoksa bugünkü "Henüz listelenecek tekne yok".

## Backend değişikliği (`D:\Tekne\Tekne.Project.Api`)

Şehir düğümünün çalışması için gereken en küçük değişiklik:

1. `BoatListFilterInputModel`'e `int? CityId`.
2. `BoatQueryHandler.Handle`'a `if (filter?.CityId is int cityId) boats = boats.Where(b => b.CityId == cityId);`
3. `GetBoatListQueryValidator`'a `CityId > 0` kuralı (mevcut `HarborId`
   kalıbıyla aynı).

`City` → `Harbor` hiyerarşisinde tekne tek şehirde hizmet verdiği için
`b.CityId` doğrudan karşılaştırılabiliyor; `Harbors` koleksiyonuna gerek yok.
Ayrı repoda ayrı commit.

## Kapsam dışı

- **Müsaitlik filtresi.** Backend'de yok; bu iş onu eklemez.
- **Gecelik arama.** Tip seçici ve gecelik girdiler (giriş–çıkış tarihi) sonraki
  iş.
- **Anasayfaya öne çıkan tekneler.** Home yer tutucu kalır; ızgara sınıfları
  hazır olduğunda aynı kartları kullanır.
- **Sıralama seçenekleri.** Backend `Id DESC` sabit.
- **Harita görünümü.**
