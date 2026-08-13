# AppAmountInput — Tasarım

**Tarih:** 2026-08-11
**Kapsam:** Para/tutar girişi için paylaşılan form bileşeni; Fiyatlandırma
sekmesindeki 7 sayı alanı buna geçer.

## Amaç

Fiyat alanları düz `app-input type="number"` ile giriliyor: TL göstergesi
etikette parantez içinde, binlik ayraç yok, mobilde tam sayısal klavye garanti
değil, eksi değer yazılabiliyor (validator mesajıyla yakalanıyor). Tutara özgü
davranış tek bileşende toplanır.

## Kararlar (kullanıcıyla netleşti)

| Konu | Karar |
|---|---|
| Kapsam | TL soneki + binlik ayraç maskesi + mobil sayısal klavye. Kuruş yok (tam TL). |
| Eksi değer | **Maske eksiyi hiç kabul etmez** (`-` yazılamaz). Buna güvenilerek formdaki `greaterThanZero` validate çağrıları **kaldırılır** — alan bazlı "0'dan büyük olmalı" mesajı kalmaz. |
| Sıfır ucu | İstemci mesajı yok; kullanıcı `0` girerse backend validator'ı reddeder, mesajı interceptor toast'la gösterir (nadir uç, bilinçli). |
| Ad | `AppAmountInput`, selector `app-amount-input`, dosya `app-amount-input.ts` — `app-password-input`/`app-phone-input` adlandırmasıyla tutarlı. |

## Bileşen

**Dosya:** `src/app/shared/forms/app-amount-input.ts` (tek dosya, inline
template — AppInput gibi). `@forms` barrel'ına (`src/app/shared/forms/index.ts`)
export eklenir.

**API — AppInput ile aynı yüzey, tutara özel davranış içeride:**

- `label = input.required<string>()`
- `field = input.required<FieldTree<number | null>>()`
- `optional`, `hideLabel` (booleanAttribute), `placeholder` — AppInput'takiyle aynı anlamda

**Template:** `hlmField` + label (`sr-only` desteği) + `hlmInputGroup` içinde:

- Metin input (`type="text"`, `inputmode="numeric"`) — sayısal klavye mobilde
  garanti; maske karakter süzer.
- Sağda **₺ (lira) ikonu**: `hlm-input-group-addon align="inline-end"` içinde
  `ng-icon name="lucideTurkishLira"` (kullanıcı kararı 2026-08-11 — "TL"
  metni yerine ikon; `@ng-icons/lucide` kurulu, AppInput'un `provideIcons`
  deseniyle).
- Altta AppInput'taki `touched` + `ErrorMessagePipe` hata bloğunun aynısı
  (required gibi form kuralları için; tutar bileşeni kendi mesajını üretmez).

**Maske:** ngx-mask (`NgxMaskDirective` + `provideNgxMask` — app-phone-input'ta
kurulu desen): `separator.0`, `thousandSeparator: '.'`, negatif kapalı.
Yazarken `1500` → `1.500`; `-`, harf, virgül girilemez.

**Değer dönüşümü:** Form modeli **`number | null` kalır**. Bileşen maskeli
metni sayıya, sayıyı maskeli metne kendisi çevirir (ngx-mask'ın sayı çıkış
mekanizması; yoksa input event'inde elle parse — implementasyonda ngx-mask
dokümanından doğrulanır). Boş giriş **`null`** üretir, `0` değil.

## Fiyatlandırma sekmesine etkisi

- `boat-pricing.html`'deki 7 `app-input` → `app-amount-input`; etiketlerden
  "(TL)" kalkar (sonek gösteriyor), `basePlaceholder` bağlanmaya devam eder
  (`toLocaleString('tr-TR')` çıktısı maske biçimiyle aynı: `1.500`).
- `boat-pricing.ts`: `rateFields` döngüsü ve içindeki `validate(...)`
  (greaterThanZero) **silinir**; `required(path.baseRate)` kalır. `AppInput`
  import'u `AppAmountInput` ile yer değiştirir (başka `app-input` kullanımı
  kalmıyor).
- `pricing-breakdown.ts` ve örnek hesap değişmez (negatif artık girilemediği
  için "negatif dilim örnekte görünür" park edilmiş bulgusu kendiliğinden
  kapanır).

## Kapsam dışı (YAGNI)

Para birimi seçimi, kuruş/ondalık, min/max girdileri, prefix ikonu.

## Test

Proje kuralı: yeni test yok; mevcut süit yeşil tutulur. Doğrulama build +
tarayıcıda elle (maske davranışı, TL soneki, kaydet akışı).
