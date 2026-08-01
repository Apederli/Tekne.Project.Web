# Toast + onay diyaloğu servisleri — tasarım

Tarih: 2026-08-01
Durum: onaylandı, uygulanmadı

## Amaç

İki kullanıcı-geri-bildirim yeteneğini servisleştirmek:

1. `errorInterceptor`'daki geçici `window.alert()`'i toast ile değiştirmek
   (interceptor'daki TODO'nun kendisi).
2. Geri döndürülemez işlemler için `confirm(options)` ile açılan onay
   diyaloğu; ilk tüketici fotoğraf silme.

Her şey spartan üstünde: toast motoru kurulu `@spartan-ng/brain`'in
`sonner` girişinden (`toast` fonksiyonu), görseller kopyalanmış `sonner` ve
`dialog` helm'lerinden. **Yeni npm bağımlılığı yok.**

## Kapsam

Dahil: `ToastService`, `<hlm-toaster>` kök yerleşimi, interceptor geçişi,
`ConfirmService` + `ConfirmDialog` bileşeni, fotoğraf silme onayı.

Hariç (bilinçli):

- **spartan `alert` bileşeni kurulmaz** — sayfa içi statik banner; servisten
  gösterilecek bir şey değil, bugün tüketicisi yok.
- **spartan `alert-dialog` bileşeni kurulmaz** — şablon-tabanlı trigger
  ister; servisten açma işini kurulu `dialog`'un `HlmDialogService`'i
  görüyor.
- **`success`/`info` toast'larının akışlara serpiştirilmesi** — metotlar
  hazır olur ama bu işte yalnızca `error` bağlanır; "fotoğraf silindi"
  gibi olumlu bildirimler ayrı bir karar.
- **Push notification / bildirim merkezi** — isimlendirme bu yüzden
  `ToastService`: `Notification*` isim alanı ileride Capacitor push ve
  uygulama içi bildirimlere saklanıyor (kullanıcı kararı, 2026-08-01).
- Yeni test yazımı (proje kararı).

## Parçalar

### 1. `ToastService` — `core/services/toast.service.ts`

`@Service()`; `@spartan-ng/brain/sonner`dan `toast`'u sarar:

- `error(message: string)`, `success(message: string)`, `info(message: string)`.
- Platform tarayıcı değilse üç metot da sessiz no-op — SSR'da toast anlamsız,
  çağıran taraf platform düşünmek zorunda kalmasın.
- Barrel'a (`@services`) eklenir.

### 2. `<hlm-toaster>` — App kökü

`app.html`'e (progress bar'ın yanına) bir kez:
`<hlm-toaster richColors position="top-center" />`

Konum **üst-orta**: market mobilde alt navigasyon çubuğu var; alta konan
toast onu örterdi. `richColors` hata toast'unu kırmızı ailede boyar.

### 3. `errorInterceptor` geçişi

- `alert(toMessage(error))` → `toastService.error(toMessage(error))`
  (functional interceptor gövdesinde `inject(ToastService)`).
- `SILENT_ERRORS` bayrağı, SSR dalındaki `console.error` ve `toMessage`
  eşlemesi aynen kalır. "alert geçici" TODO yorumu silinir.
- Yan kazanım: önceki incelemenin "alert açıkken ilerleme barı dönmeye
  devam ediyor" bulgusu kendiliğinden kapanır — toast bloklamaz.

### 4. `ConfirmOptions` — `core/models/confirm.ts`

```ts
export interface ConfirmOptions {
  title: string;
  message?: string;
  /** Varsayılan: "Onayla" */
  confirmText?: string;
  /** Varsayılan: "Vazgeç" */
  cancelText?: string;
  /** true ise onay butonu destructive görünür. */
  destructive?: boolean;
}
```

(Kural: interface bileşen dosyasında yaşamaz → `core/models/`.)

### 5. `ConfirmService` — `shared/confirm-dialog/confirm.service.ts`

Bileşenle aynı klasörde yaşar (barrel'a girmez): servis `ConfirmDialog`
bileşenine referans verdiği için `@services` barrel'ına konursa dialog
helm'i barrel'ı import eden herkese bulaşırdı — barrel'ın kendi başlık
yorumu bunu yasaklıyor. Tüketici doğrudan dosyadan import eder.

- Tek metot: `confirm(options: ConfirmOptions): Promise<boolean>`.
- Kurulu dialog helm'inin `HlmDialogService.open(ConfirmDialog, { context: options })`
  çağrısıyla açar; diyaloğun kapanış değerini bekler.
- **Yalnızca onay butonu `true` üretir.** Vazgeç butonu, backdrop'a dokunma
  ve Escape → `false` (undefined kapanış değeri `false`'a normalize edilir).
  Yıkıcı işlemde "kazayla evet" imkânsız olmalı; "kazayla hayır" zararsız.

### 6. `ConfirmDialog` — `shared/confirm-dialog/`

- Kurulu dialog helm parçalarıyla kompozisyon: header + title,
  `message` varsa description, footer'da iki `hlmBtn`.
- Onay butonu `options.destructive` ise `variant="destructive"`, değilse
  varsayılan; Vazgeç `variant="outline"`.
- Butonlar **iki eşit sütunlu grid** (kullanıcı kararı, 2026-08-01): genişliği
  metin uzunluğu değil düzen belirler, her ekranda ikisi de aynı boyda;
  dokunma hedefleri `h-10` (my-boats kararıyla tutarlı — hlmBtn varsayılanı
  32px, yetersiz).
- Kutu genişliği (kullanıcı kararı, 2026-08-01): `w-[min(32rem,calc(100vw-2rem))]`
  — masaüstünde 32rem, telefonda kenarlardan 1rem boşluk; helm'in
  `sm:max-w-sm` sınırı bilinçli eziliyor (varsayılan 384px dar bulundu).
- Diyalog `role: 'alertdialog'` ile açılır — ekran okuyucu başlık ve mesajı
  açılışta okur.
- Context, brain dialog'un context injection mekanizmasıyla alınır
  (kopyalanan helm sürümündeki birebir API plan aşamasında
  `hlm-dialog.service.ts`'ten okunarak yazılır).

### 7. İlk kullanım: fotoğraf silme onayı

Onay kapısı yeni bir `confirmRemove(photo, index)` metodudur; şablondaki
çöp butonu artık onu çağırır. `remove()` ham silme olarak **değişmeden**
kalır — silme mekaniği (karşılıklı dışlama, emit) onaydan bağımsız test
edilebilir ve mevcut testler kırılmaz.

`confirmRemove` akışı:

1. `busy()` ise çık.
2. `await confirm({ title: '{N}. fotoğraf silinsin mi?', message: 'Bu işlem geri alınamaz.', confirmText: 'Sil', destructive: true })`.
3. Onay yoksa hiçbir şey yapmadan çık.
4. Onay geldiyse `busy()` **yeniden** kontrol edilir (diyalog açıkken
   başka bir işlem başlamış olabilir), temizse `remove(photo)` çağrılır.

`photosChanged` sözleşmesi ve karşılıklı dışlama düzeni değişmez.

## Veri akışı

```
HTTP hatası → errorInterceptor → ToastService.error → toast (brain) → <hlm-toaster>
Çöp butonu → ConfirmService.confirm → HlmDialogService.open(ConfirmDialog) → Promise<boolean> → silme
```

## Riskler

- `HlmDialogService.open`'ın imzası ve context okuma yolu, projedeki
  kopyalanmış helm sürümünden doğrulanacak (varsayımla yazılmayacak).
- `photo-uploader.spec.ts`'te silme testleri varsa onay adımı yüzünden
  kırılabilir — asgari uyarlama (onayı otomatik `true` dönecek şekilde
  servis stub'u) yapılır, yeni senaryo eklenmez.
