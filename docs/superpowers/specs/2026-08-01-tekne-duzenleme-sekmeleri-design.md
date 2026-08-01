# Tekne düzenleme sayfası — sekmeler — tasarım

Tarih: 2026-08-01
Durum: onaylandı, uygulanmadı

## Amaç

Partner, kayıtlı bir teknesini tek bir sayfadan yönetsin. Sayfa dört sekmeye
bölünür: **Genel bilgiler**, **Fotoğraflar**, **Kullanım şartları**,
**İmkanlar**. Bugün ayrı bir sayfa olan fotoğraf yönetimi bu sayfanın bir
sekmesine iner.

## Kapsam

Dahil: `duzenle` route'u, sekmeli kapsayıcı, sekme ↔ URL senkronu,
`BoatForm`'un düzenleme modunu da yapar hâle gelmesi, `BoatPhotos`'un sekmeye
dönüşmesi, iki placeholder sekme, `BoatService.update`, `my-boats`
linklerinin yeni hedefe çevrilmesi.

Hariç (bilinçli):

- **Yeni test yazımı** — proje kararı. Kırılan mevcut test varsa yalnızca
  asgari uyarlanır (`boat-form.spec.ts`, `provider.routes.spec.ts`).
- **Kullanım şartları ve imkanlar işlevi** — backend'de karşılığı yok
  (aşağıya bak). Bu turda yalnızca sekme yerleri açılır.
- **Ortak bir `app-tabs` sarmalayıcısı** — gerekçesi "Bilinçli kararlar"da.

## Backend bağımlılıkları

API'de (`localhost:5188/swagger/v1/swagger.json`, 2026-08-01) bugün yalnızca
şunlar var: `POST/GET /api/Boats`, `GET /api/Boats/mine`,
`GET /api/Boats/{id}`, fotoğraf uçları, `GET /api/Harbors`, `Users/*`.

Eksik olanlar — **kullanıcı bunları backend'e kendisi ekleyecek**:

| Uç | Kimin için | Bu tur olmadan ne olur |
|---|---|---|
| `PUT /api/Boats/{id}` | Genel bilgiler sekmesi | Form çizilir ve doğrular, "Kaydet" 404 döner |
| İmkanlar uçları | İmkanlar sekmesi | Sekme placeholder kalır |
| Kullanım şartları uçları | Kullanım şartları sekmesi | Sekme placeholder kalır |

Frontend `PUT /api/Boats/{id}`'i **varmış gibi** yazar; uç eklendiğinde
kendiliğinden çalışır.

## Route ve URL

`ROUTE_PARTNER`'a yeni segment:

```ts
/** `boats/:boatId` altına eklenir: `/partner/dashboard/teknelerim/5/duzenle`. */
boatEdit: 'duzenle',
```

Nihai adres:

```
/partner/dashboard/teknelerim/5/duzenle?sekme=fotograflar
                              ^                  ^
                              boatId             aktif sekme
```

`provider.routes.ts` içinde `:boatId/fotograflar` girdisi **kaldırılır**,
yerine `:boatId/duzenle` gelir. Sıra korunur: parametreli girdiler düz
`ROUTE_PARTNER.boats` girdisinden önce kalmalı.

`app.routes.server.ts` **değişmez** — `partner/**` zaten
`RenderMode.Client`.

`ROUTE_PARTNER.boatPhotos` sabiti sekme slug'ı olarak yaşamaya devam eder
(aşağıdaki slug tablosuna bak).

## Sekme ↔ URL senkronu

Aktif sekme `sekme` query param'ında tutulur.

| Sekme başlığı | Slug |
|---|---|
| Genel | `genel` (varsayılan) |
| Fotoğraflar | `fotograflar` |
| Şartlar | `sartlar` |
| İmkanlar | `imkanlar` |

Başlıklar kısa tutuldu — dört uzun başlık telefonda şeride sığmıyor.

Gerekçe: `my-boats` kartındaki "Fotoğraflar" butonu doğrudan o sekmeye
düşmeli; ayrıca sayfa yenileme ve tarayıcı geri tuşu sekmeyi korumalı.

`withComponentInputBinding()` açık olduğu için kapsayıcı hem route param'ını
hem query param'ını input olarak alır:

```ts
boatId = input.required<string>();
sekme = input('genel');
```

Slug'lar `boat-edit.ts` içinde bir dizi sabit olarak durur (başlık + slug
çiftleri); şablon sekme şeridini bu diziden `@for` ile çizer.

Sekme değişince kapsayıcı `router.navigate([], { relativeTo, queryParams,
replaceUrl: true })` çağırır. `replaceUrl` bilinçli: sekme gezinmesi geçmişe
yığılmaz, "geri" kullanıcıyı teknelerim listesine döndürür.

Tanınmayan bir slug gelirse (`?sekme=xyz`) Genel sekmesi açılır.

## Klasör düzeni

Düz, `boats/` altında mevcut kardeşlerle aynı hizada — iç içe `tabs/`
klasörü yok:

```
features/provider/boats/
  boat-edit/        kapsayıcı (yeni)
  boat-form/        create + update (mevcut, genişler)
  boat-photos/      route sayfasından sekmeye iner (mevcut, daralır)
  boat-terms/       yeni, placeholder
  boat-amenities/   yeni, placeholder
  my-boats/         mevcut, iki link değişir
  photo-uploader/   dokunulmaz
```

## Kapsayıcı: `BoatEdit`

Route'a bağlı tek bileşen. İşi:

1. Tekneyi `rxResource` ile yükler — **yalnızca başlık için** (tekne adı).
   Yüklenme ve hata durumları burada tek yerde gösterilir; deseni
   bugünkü `BoatPhotos` ile aynı (`loading()`, `failed()`).
2. `‹ Teknelerim` geri linkini ve `<h1>{{ boat.name }}</h1>` başlığını çizer
   — bunlar bugün `boat-photos.html`'in ilk satırlarında, oradan buraya
   taşınır.
3. Sekme şeridini çizer: `hlm-tabs` > `hlm-paginated-tabs-list` > dört
   `hlmTabsTrigger`.
4. Dört sekme içeriğini `HlmTabsContentLazy` ile barındırır.

Sekmelere **hiçbir veri girdisi geçmez**; her sekme kendi verisini çeker
(gerekçe "Bilinçli kararlar"da).

### Sekmelerin `boatId`'yi okuması

`withComponentInputBinding()` route param'ını yalnızca **route'a bağlı**
bileşenin input'una bağlar. Sekmeler kapsayıcının çocuğu olduğu için bu
bağlama onlara ulaşmaz; `inject(ActivatedRoute)` ile okurlar — enjekte
edilen route kapsayıcınınkine çözülür, `:boatId` oradadır.

`BoatPhotos`'un bugünkü `boatId = input.required<string>()` satırı buna
dönüşür.

### Mobil

Sekme şeridi telefonda dört başlığı sığdıramayabilir. Bu yüzden düz
`hlm-tabs-list` yerine `hlm-paginated-tabs-list` kullanılır: sığmadığında
şeridin iki ucunda ok butonları belirir, sığdığında gizlenirler
(`showPaginationControls`). Aynı `listVariants` stilini uyguladığı için
görünüm düz listeyle aynı kalır. `@angular/cdk/observers` bağımlılığı
kurulu (CDK zaten sürükle-bırak için kullanılıyor).

Ok butonları `aria-hidden` + `tabindex="-1"` — klavye ve ekran okuyucu
sekmeler arasında ok tuşlarıyla gezinmeye devam eder, şerit kendiliğinden
kayar.

Tetikleyiciler dokunma hedefi boyutunda kalır — `my-boats` aksiyon
butonlarındaki 40px kararıyla tutarlı.

## `FormMode` enum'u

`src/app/core/enums/form-mode.ts`, mevcut enum'larla aynı string-enum
stilinde:

```ts
export enum FormMode {
  Create = 'Create',
  Update = 'Update',
}
```

`@enums` barrel'ına satırı eklenir. Klasördeki diğer enum'lardan farkı
**backend karşılığı olmaması**; dosya yorumunda bu belirtilir, çünkü
oradaki her enum'da "Kaynak: `*.cs`" notu var ve bu enum için böyle bir
kaynak yok.

## `BoatForm`: create + update

Tek bileşen iki işi yapar. Girdi:

```ts
screenOpenType = input<FormMode>(FormMode.Create);
saved = output<void>();
```

`Update` modunda tekne **dışarıdan geçmez** — bileşen `boatId`'yi
`ActivatedRoute`'tan okur ve tekneyi kendisi çeker.

Kullanımı:

```html
<!-- Genel sekmesi -->
<app-boat-form [screenOpenType]="FormMode.Update" />

<!-- /yeni sayfası: girdi verilmez, varsayılan Create -->
<app-boat-form />
```

### Doldurma

`model` bugün düz `signal<BoatFormModel>`; `linkedSignal`'a döner:
yüklenen tekne varsa ondan türetilir, yoksa bugünkü boş hâl. `BoatPhotos`'un
`photos` alanındaki desenle aynı.

Dönüşümde dikkat: `BoatFormModel` alanları form çalışma tipinde —
`cityId`/`primaryHarborId` string, sayısal alanlar `null` olabilir,
`description` `''`. `BoatOutputModel` → `BoatFormModel` çevirimi bunu
karşılar.

Liman kaskadı (`primaryHarborId`'yi listede yoksa temizleyen `effect`)
olduğu gibi kalır: doldurulan teknede `primaryHarborId` zaten `harborIds`
içinde olduğu için doldurma anında tetiklenmez.

### Kaydetme

`save()` moda göre dallanır:

- **Create** — `boatService.create(input)` → teknelerim listesine yönlendirir
  (bugünkü davranış).
- **Update** — `boatService.update(id, input)` → `saved.emit()`; kapsayıcı
  başlığı tazelesin diye. Yönlendirme yok, kullanıcı sekmede kalır.

try/catch yok: mesajı `errorInterceptor` gösterir, başarısızlıkta
yönlendirmeye/emit'e ulaşılmaz (mevcut konvansiyon).

### Şablonda moda bağlı üç nokta

Form gövdesinin ~195 satırı iki modda birebir aynı. Yalnızca şunlar
koşullanır:

| Yer | Create | Update |
|---|---|---|
| Başlık + açıklama (1-4. satır) | görünür | görünmez (kapsayıcı başlığı var) |
| Gönder butonu | "Tekneyi kaydet" | "Değişiklikleri kaydet" |
| "Vazgeç" linki | görünür | görünmez (kapsayıcının geri linki var) |

## `BoatPhotos`: sekmeye iniş

Bileşen daralır:

- `boatId` artık `ActivatedRoute`'tan okunur.
- Geri linki ve `<h1>` başlığı silinir — kapsayıcıya taşındı.
- Tekneyi yükleme (`rxResource`), `photos` `linkedSignal`'i ve
  `PhotoUploader` kullanımı **aynen kalır**.
- "Fotoğraflar — ilk sıradaki fotoğraf ilanın kapağıdır." açıklaması sekme
  içeriğinin başında kalır.

`PhotoUploader` ve `photosChanged` sözleşmesi değişmez.

## Placeholder sekmeler

`BoatTerms` ve `BoatAmenities`: veri çekmeyen, tek kutu çizen bileşenler.
Kutu deseni `my-boats.html`'deki "Henüz ilanınız yok" kutusuyla aynı
(kesikli çerçeve, ortalanmış metin) — yeni bir bileşen ya da spartan
`empty` kurulumu gerekmiyor.

Metin: başlık + "Bu bölüm yakında eklenecek." Backend uçları geldiğinde
kutunun yerini gerçek içerik alır.

## Servis

`BoatService`'e tek metot:

```ts
/** Partner kendi teknesini günceller — yalnızca `Partner` rolü. */
update(id: number, model: BoatInputModel): Observable<void> {
  return this.http.put<void>(`${this.baseUrl}/${id}`, model);
}
```

Gövde `BoatInputModel` — create ile aynı şema varsayılıyor. Backend farklı
bir `BoatUpdateInputModel` üretirse model `core/models/boat.ts`'e eklenir
(Swagger'dan doğrulanarak).

## `my-boats` link değişikliği

[my-boats.html](../../../src/app/features/provider/boats/my-boats/my-boats.html)
içinde iki yer:

- Kart gövdesindeki büyük link → `duzenle` (query param'sız, Genel sekmesi
  açılır). Kod içindeki "Düzenleme geldiğinde yalnızca bu linkin hedefi
  değişecek" yorumu silinir.
- Aksiyon şeridindeki "Fotoğraflar" butonu → `duzenle?sekme=fotograflar`.
  Yanına birincil "Düzenle" butonu eklenir (yine `duzenle`, param'sız);
  şeritteki yorum notu buna göre güncellenir.

`photosUrl()` yardımcısı `editUrl(boatId, sekme?)` olur.

## Bilinçli kararlar

**Ortak `app-tabs` sarmalayıcısı yazılmıyor.** `hlm-tabs` doğrudan compose
edilir, query param senkronu kapsayıcının içinde durur (~8 satır).
`app-select`/`app-multi-select` sarılmıştı çünkü her kullanımda ~20 satırlık
Signal Forms + etiket + hata tekrarını yutuyorlardı; tabs'ta böyle bir
tekrar yok ve içerik `ng-content` ile geçmediği için sarmalayıcı sekme başına
`<ng-template>` kurgusu gerektirirdi — kazandırdığından fazlası. CLAUDE.md
"`shared/` ince tutulmalı" diyor. İkinci bir ekran URL'e bağlı sekmeye
ihtiyaç duyduğunda o zaman çıkarılır.

**Veriyi her sekme kendi çeker.** Kapsayıcı `boat`'ı input olarak geçmez.
Bedeli: aynı tekne için kapsayıcı (başlık) + Genel sekmesi + Fotoğraflar
sekmesi olmak üzere üç istek. `HlmTabsContentLazy` sekme içeriğini ilk
açılışa kadar geciktirdiği için kullanıcı sekmeye girmedikçe ek istek
oluşmaz. Tek kaynaktan besleme bu isteği tamamen kaldırırdı; sekmelerin
birbirinden ve kapsayıcıdan bağımsız olması tercih edildi.
