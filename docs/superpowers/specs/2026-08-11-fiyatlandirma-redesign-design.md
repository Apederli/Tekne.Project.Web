# Fiyatlandırma Sekmesi Yeniden Tasarımı — Tasarım

**Tarih:** 2026-08-11
**Kapsam:** Mevcut Fiyatlandırma sekmesinin sunumunu, tarayıcı eşlikçisinde
onaylanan maket doğrultusunda yeniden kurmak (`hybrid-ca-v2` maketi —
`.superpowers/brainstorm/868-1786479953/content/`). Veri modeli, servis,
form şeması ve hesaplama değişmez.

## Onaylanan yön (kullanıcıyla netleşti)

C (aşamalı görünüm) + A (öğreten matris) birleşimi; tüm açıklama metinleri
görünür kalır. Ek karar: para birimi **"TL" ibaresi** olarak
`app-amount-input` sonekinde (₺ ikonu denendi ve geri alındı).

## Yerleşim

İki sütunlu `lg:` grid **korunur** (3:2, `gap-x-8`; örnek hesap kartı satırı
doldurur — stretch). Solda sırayla: Kart 1, Kart 2 (koşullu), Kaydet.
Mobilde tek sütun, DOM sırası: Kart 1 → Kart 2 → örnek hesap → Kaydet.

## Kart 1 — Temel saatlik ücret

Mevcut `hlmCard` deseni (boat-form'daki `section hlmCard` kullanımına uyar):

- Başlık: **Temel saatlik ücret**
- `app-amount-input` (block, `sm:max-w-[12rem]`)
- Altında açıklama (birebir korunur): "Teknenizin standart 1 saatlik
  kiralama ücretini girin. Farklı fiyat belirtmediğiniz tüm gün ve
  saatlerde bu ücret uygulanır."
- İnce ayraçla ayrılmış **anahtar satırı**: switch + "Gün ve saate göre
  farklı fiyat belirle"

### Anahtar (switch) davranışı

- Durum `useMatrix` (signal): ilk değeri sunucudan türer — 6 dilim
  alanından herhangi biri doluysa **açık**, hepsi boşsa **kapalı**
  (`linkedSignal`; kullanıcı elle değiştirebilir).
- Kapatmak Kart 2'yi gizler; girilmiş değerler **modelde korunur**
  (yeniden açınca geri gelir — yanlış tıkta veri kaybı yok).
- **Kapalıyken Kaydet:** 6 dilim `null` gönderilir (tek fiyat niyeti).
  Kayıt başarılı olursa modeldeki dilimler de temizlenir — ekran,
  sunucudaki hâlle çelişmesin.
- Switch bileşeni: spartan **switch** henüz kurulu değil
  (`src/app/shared/ui/` altında yok) — spartan CLI ile eklenir. Eklenemezse
  geri dönüş: `hlm-checkbox` ile aynı satır düzeni (davranış aynı kalır).

## Kart 2 — Gün ve saat farkları (yalnız `useMatrix` açıkken)

- Başlık: **Gün ve saat farkları**
- Açıklama (birebir korunur): "Farklı fiyat uygulamak istediğiniz alanları
  doldurun. Boş bıraktığınız alanlarda temel saatlik ücret geçerli olur."
- Matris — mevcut 3 sütunlu grid; sütun başlıkları alt etiketli
  (Hafta içi / Pazartesi–Cuma, Hafta sonu / Cumartesi–Pazar), satır
  başlıkları mevcut hâliyle (Sabah 08:00–18:00 …).
- **Hücre görünümü** (`app-amount-input`'a opsiyonel `cell` girdisi;
  bileşen kendi değerine bakarak sınıf uygular, dışarıdan kablolama yok):
  - Boş hücre: kesikli, soluk çerçeve (`border-dashed border-input`),
    placeholder **"Temel: 4.500"** (kısaltıldı — "TL" zaten sonekte;
    `basePlaceholder` computed'ı bu kalıba güncellenir).
  - Dolu hücre: yeşil vurgu — `border-primary-deep` + `bg-primary/10`
    (tema token'ları; hex yazılmaz).
- Kartın altında **"Nasıl doldurmalıyım?"** kutusu — mevcut `bg-muted/50`
  kutu, üç senaryo metniyle **birebir aynen** taşınır (metinler
  değişmez, hep görünür).

## Örnek hesap kartı (sağ sütun)

- Yeşil tonlu kart: `bg-primary/10` zemin, `border-primary/20` çerçeve
  (maketteki #f0f5f2 hissi tema token'larıyla).
- Başlık **Örnek hesap** `text-primary-deep`; altına küçük not:
  "Girdiğiniz fiyatlarla anında güncellenir".
- Her senaryo beyaz zeminli iç kartta (`bg-background rounded-lg`);
  içerik ve hesap **değişmez** (`breakdown` + iki sabit senaryo).
- Görünürlük kuralı değişmez: temel ücret geçersizken kart render edilmez.

## Değişmeyenler

- `BoatPricingService`, modeller, `pricing-breakdown.ts`, form şeması
  (`required(path.baseRate)` yalnız), Kaydet akışı/toast'ları, gecelik
  tekne notu, hata durumu metni.
- Yükleme iskeleti kart yapısına kabaca uydurulur (iki kart bloğu).

## Dosya etkisi

| Dosya | İş |
|---|---|
| `src/app/shared/ui/switch/` | spartan CLI ile eklenir (yeni) |
| `src/app/shared/forms/app-amount-input.ts` | `cell` girdisi (boş/dolu hücre görünümü) |
| `src/app/features/provider/boats/boat-pricing/boat-pricing.ts` | `useMatrix` signal'i, kapalıyken null gönderme + kayıt sonrası temizlik, `basePlaceholder` kalıbı |
| `src/app/features/provider/boats/boat-pricing/boat-pricing.html` | kartlı yerleşim, switch, hücre görünümü, örnek hesap kartı stili, iskelet |

## Test

Proje kuralı: yeni test yok; mevcut süit yeşil. Doğrulama build + kullanıcı
tarayıcıda (dev server açık).
