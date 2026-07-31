# Fotoğraf yükleme component'i — tasarım

Tarih: 2026-07-31
Durum: onaylandı, uygulanmadı

## Amaç

Partner'ın bir tekneye fotoğraf yüklemesini ve yüklediğini silmesini sağlayan,
tek başına duran bir component. Sıralama (sürükle-bırak) bu turun **dışında**,
ayrı bir adımda eklenecek.

Bu turda component hiçbir sayfaya bağlanmıyor; boat-form ve my-boats'a
gömülmesi ileride ayrıca kararlaştırılacak.

## Kapsam

Dahil: yükleme, silme, istemci tarafı dosya elemesi, yükleme sırasında durum
gösterimi, testler.

Hariç: sıralama / `reorder`, kapak seçme ucu (`setMain` istemciden çıkarıldı),
herhangi bir sayfaya entegrasyon, `BoatService.getById`.

## Yerleşim

`src/app/features/provider/boats/photo-uploader/`
— `photo-uploader.ts`, `photo-uploader.html`, `photo-uploader.spec.ts`

`shared/` altına konmuyor: `BoatPhotosController`'ın uçlarının tamamı `Partner`
politikasına bağlı, market alanı bu component'i kullanmayacak. CLAUDE.md'deki
"bir şey tek bir alana aitse o alanın klasöründe kalır" kuralı geçerli.

## Dış yüzey

```ts
boatId = input.required<number>();
photos = input.required<BoatPhotoOutputModel[]>();
photosChanged = output<BoatPhotoOutputModel[]>();
```

Component veri çekmez ve kalıcı liste tutmaz; gösterdiği şey `photos()`
girdisidir. Her başarılı yükleme veya silmeden sonra **tam liste**
`photosChanged` ile emit edilir; listeyi tazelemek host'un sorumluluğudur.
Böylece gerçek listenin sahibi tek bir yerdir.

Component içinde yalnızca geçici durum yaşar: uçmakta olan yüklemenin dosya
sayısı, silinmekte olan fotoğrafın id'si, elenen dosyalara ait mesaj.

## Davranış

### Yükleme

Dosya seçilir seçilmez tek `BoatPhotoService.upload(boatId, files)` isteği gider
— ayrı bir "Yükle" düğmesi yok. Gerekçe: mobilde fazladan dokunuş istenmiyor ve
yanlış seçilen fotoğraf zaten tek dokunuşla silinebiliyor.

İstek uçarken, gönderilen dosya sayısı kadar iskelet kutucuk ızgaranın sonunda
görünür. Yanıt gelince `photos()` + dönen fotoğraflar emit edilir, iskeletler
kalkar.

### İstemci tarafı eleme

Backend doğrulaması toplu çalışıyor: tek geçersiz dosya isteğin tamamını 400'e
düşürüyor (`UploadBoatPhotosCommandValidator`). Bu yüzden gönderimden önce
istemcide eleme yapılır:

- İzinli görsel tipleri dışındaki dosyalar elenir.
- 10MB üzerindeki dosyalar elenir.
- Mevcut fotoğraf sayısı + seçilen sayı 20'yi aşarsa fazlası kırpılır.
- Sınıra ulaşılmışsa dosya seçici kapatılır.

Elenen dosya varsa ızgaranın altında kaç dosyanın neden atlandığını söyleyen bir
satır çıkar; kalan geçerli dosyalar normal şekilde gönderilir. Geçerli dosya
kalmamışsa istek hiç açılmaz.

### Silme

Kutucuk üstündeki düğme `BoatPhotoService.delete(boatId, photoId)` çağırır;
istek sürerken o kutucuk meşgul görünür. Başarılıysa o fotoğrafı çıkarılmış
liste emit edilir.

### Hata

`try/catch` yok — hata mesajını `errorInterceptor` gösteriyor. `subscribe`'ın
error dalı yalnızca geçici durumu (iskeletler, meşgul kutucuk) temizler ki UI
kilitli kalmasın. Hatada `photosChanged` emit edilmez.

## Arayüz (mobile-first)

Kare oranlı ızgara: taban `grid-cols-2`, `sm:grid-cols-3`, `lg:grid-cols-4`.

- **Ekle alanı** ızgaranın ilk hücresidir: kesikli çerçeve, ikon ve "Fotoğraf
  ekle" metni. Gizli `<input type="file" accept="image/*" multiple>` bir
  `<label>` ile sarılı — telefonda tek dokunuşla native galeri açılır.
- **Sürükle-bırak** aynı alana `dragover` / `drop` ile bağlanır; masaüstünde ek
  yetenek, mobilde görünmez.
- **Sil düğmesi her kutucukta her zaman görünür**, hover'a bağlı değil —
  dokunmatikte hover yok. Sağ üstte küçük yuvarlak düğme, `sr-only` metinli.
- **"Kapak" rozeti** ilk sıradaki fotoğrafta. Sıralama ölçütü `PhotoGallery` ile
  aynı tutulur (önce `isMain`, sonra `sortOrder`) ki iki ekran farklı fotoğrafı
  kapak sanmasın.
- Yükleme sürerken iskelet kutucuklar `animate-pulse` ile ızgaranın sonunda
  durur. Hiç fotoğraf yokken ayrı bir boş durum ekranı yoktur; ızgara yalnızca
  ekle alanından ibarettir.

## Test

Vitest + `TestBed` + `HttpTestingController`, mevcut spec'lerdeki kalıpla:

1. Dosya seçimi doğru URL'e `FormData` POST'lar (alan adı `files`), yanıt sonrası
   `photosChanged` mevcut + yeni fotoğrafları birlikte emit eder.
2. Desteklenmeyen tip ve 10MB üstü dosya isteğe girmez, atlandı mesajı görünür,
   kalan geçerli dosyalar yine gönderilir.
3. 20 sınırında seçici kapalıdır; sınırı aşan çoklu seçim kırpılarak gönderilir.
4. Silme doğru uca gider ve o fotoğrafsız listeyi emit eder.
5. 400 yanıtında iskeletler temizlenir ve `photosChanged` emit edilmez.

## Sonraki adımlar (bu spec'in dışında)

- Sürükle-bırak sıralama (`BoatPhotoService.reorder`).
- Component'in bir sayfaya bağlanması.
- Backend'de `IsMain` kolonunun kaldırılıp kapağın `sortOrder == 0` ile
  temsil edilmesi (ayrı tartışma; karar verilmedi).
