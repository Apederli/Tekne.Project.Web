# Tam ekran fotoğraf görüntüleyici (lightbox) — tasarım

Tarih: 2026-08-01
Durum: **onaylandı** (2026-08-01, kullanıcı yazılı onay verdi)

## Amaç

Tekne detay sayfasındaki fotoğrafları tam ekran, kırpılmadan gösteren
görüntüleyici. Bugün mozaikteki "+N fotoğraf" çipi tıklanmıyor
(`boat-detail.html:43` — "Tam ekran görüntüleyici sonraki tur"), yani 12
fotoğraflı bir ilanda ziyaretçi yalnızca 5'ini görebiliyor.

## Kullanıcı kararları (2026-08-01)

- **Tetik hem mobilde hem masaüstünde** — mobildeki satır içi galeri `object-cover`
  ile kırpıyor; tam ekran fotoğrafın tamamını gösterir.
- **Zoom yok** — yalnızca gezinme. (Swiper'ın zoom modülü kurulu; istenirse
  sonradan tek attribute ile açılır.)

## Barındırma: CDK Dialog + colocated servis

`shared/photo-lightbox/`: `PhotoLightbox` bileşeni + `PhotoLightboxService`
(tek metot: `open(photos, startIndex, alt)`). Confirm-dialog'daki desenin
aynısı — bileşene referans veren servis, bileşenle aynı klasörde yaşar,
`@services` barrel'ına girmez.

Overlay **`@angular/cdk/dialog`** ile açılır, `HlmDialogService` ile değil:

- Helm servisi içeriği `HlmDialogContent`'e sarar; o kap kart görünümü taşır
  (`bg-popover`, `p-4`, `rounded-xl`, `max-w-*`, ring). Tam ekran siyah bir
  görüntüleyici bunların hepsini ezmek zorunda kalırdı — confirm diyaloğunda
  `max-w` ezme kavgası zaten bir inceleme bulgusu olmuştu.
- CDK'nın kabı görsel olarak boştur ama davranışı verir: odak tuzağı, kapanışta
  odağın geri dönmesi, Escape, arka plan kaydırma kilidi, aria rolleri.
- Yeni mekanizma değil: spartan'ın brain dialog'u da CDK üstünde duruyor.
  `@angular/cdk/dialog` kurulu (`node_modules/@angular/cdk/fesm2022/dialog.mjs`
  ile doğrulandı).

Panel tam ekran (`fixed inset-0`), backdrop koyu.

## Görüntüleyici yüzeyi

- Swiper container; satır içi galeriden iki farkla:
  - `object-contain` — fotoğraf kırpılmadan, tamamı görünür (varlık sebebi).
  - Nokta sayfalama yok; üstte **"3 / 12" sayacı** (20 fotoğrafta nokta
    okunmuyor). Sayaç swiper'ın slayt değişim olayından güncellenir.
- Açılış slaytı tıklanan fotoğraf (`initial-slide`).
- Masaüstünde swiper ok düğmeleri açık; mobilde kaydırma.
- Sağ üstte 44px kapat düğmesi — dokunmatikte hover yok, daima görünür.
  Escape'i CDK hallediyor.

Satır içi `PhotoGallery` **yeniden kullanılmaz**: kart için tasarlandı
(kırpma + noktalar + yuvarlak köşe), ihtiyacın tersi. Input'larla esnetmek
kartlarda kullanılan bileşeni şişirirdi.

## Tetikler

**Mobil** — `PhotoGallery`'ye iki üye eklenir:

- `interactive = input(false)`: true iken her slayt bir `<button>` olur.
- `photoOpened = output<number>()`: tıklanan slaytın index'i.

Kullanıcı 5. fotoğrafa kaydırıp dokunduğunda lightbox 5.'den açılır (yalnızca
görünür slayt tıklanabilir olduğu için index doğal olarak doğru gelir).
Market kartları `interactive` vermez → markup'ları değişmez, kart linkinin
içine buton girmesi sorunu doğmaz.

**Masaüstü mozaik** (`boat-detail.html`):

- Kapak ve her karo `<button>` olur; etiket "Fotoğraf {N}'yi tam ekran aç".
- "+N fotoğraf" çipi karonun **kardeşi** bir buton olur (link/buton iç içe
  geçmesin) ve **ilk gizli fotoğraftan** açar (index 5) — "gerisini göster".

## Kapsam dışı (bilinçli)

- Zoom (kullanıcı kararı), indirme/paylaşma.
- **Geri tuşuyla kapanma** — Capacitor günü anlamlı (route/query param işi),
  bugün YAGNI.
- Partner fotoğraf yöneticisine bağlama.
- Yeni test yazımı (proje kararı).

## Riskler / doğrulanacaklar

- Swiper `navigation` attribute'unun element bundle'da çalıştığı ve slayt
  değişim olayının adı (`swiperslidechange`) plan aşamasında doğrulanacak.
- Bundle etkisi `npm run build` ile ölçülecek (sonner dersi). Swiper zaten
  market kartları üzerinden yüklü; boat-detail lazy route olduğu için
  başlangıç bundle'ına ek yük beklenmiyor.
