# Yönlendirme Sunucusu

Masa standındaki NFC/QR, ham Google linkine değil bu sunucuya işaret eder:
`https://deger.markamiz.com/r/<slug>`. Sunucunun **tek işi** slug'ı bulup o
işletmenin Google yorum linkine **302 yönlendirme** yapmaktır.

> **Neden ham link değil de bu sunucu?** Place ID / Google linki değişirse standı
> yeniden bastırmadan sadece `restoranlar.json`'u güncellersin. Çip/QR aynı kalır.

**Not:** Okutma sayımı / analitik **tutulmuyor**. Saklanan tek şey: işletme + url.

---

## Ne saklanıyor? (`restoranlar.json`)

```json
{
  "restoranlar": [
    {
      "slug": "ornek-restoran",
      "isletme": "Örnek Restoran",
      "url": "https://search.google.com/local/writereview?placeid=CHIJ..."
    }
  ]
}
```

- **slug**: QR/NFC'de geçen kısa ad (`/r/<slug>`). Türkçe karakter/boşluk kullanma.
- **isletme**: sadece senin için etiket (görünmez).
- **url**: müşterinin gideceği Google "yorum yaz" linki.

### Place ID → url nasıl bulunur?
1. Google **Place ID Finder** ile işletmenin Place ID'sini bul.
2. Şu kalıba yapıştır: `https://search.google.com/local/writereview?placeid=<PLACE_ID>`
3. `url` alanına bunu yaz. Bittiği an aktif olur — sunucu dosyayı **canlı okur, restart gerekmez**.

## Kurulum & çalıştırma

```bash
cd 03-sunucu
npm install
npm start            # http://localhost:3000
```

Test:
```bash
curl -i http://localhost:3000/r/ornek-restoran   # -> 302 + Location: google...
curl http://localhost:3000/health                # -> {"ok":true,...}
```

## QR üretimi

`restoranlar.json`'daki her işletme için QR (PNG + SVG) üretir; içeriği `<BASE_URL>/r/<slug>`:

```bash
BASE_URL=https://deger.markamiz.com npm run qr
# çıktı: cikti-qr/<slug>.png  ve  <slug>.svg
```

- PNG 1200px (baskıya uygun), SVG vektörel (standın QR alanına yerleşir).
- Hata düzeltme seviyesi **H**, saf siyah/beyaz — maksimum kontrast.

## Uç noktalar

| Yol | İş |
|---|---|
| `GET /r/:slug` | İşletmeyi bulur, Google linkine **302** yönlendirir (yoksa 404). |
| `GET /health` | Servis ayakta mı + kaç işletme yüklü. |
| `GET /` | Bilgi sayfası. |

## Yeni restoran eklemek (akış)
1. Place ID'yi bul → `url`'yi oluştur.
2. `restoranlar.json`'a `{slug, isletme, url}` ekle (kaydet → anında aktif).
3. `npm run qr` ile o restoranın QR'ını üret.
4. Standı bas + NFC çipine `<BASE_URL>/r/<slug>` yaz (bkz. 02-nfc).

Canlıya alma (VPS/Render, alan adı, HTTPS) bir sonraki adımda (`03-sunucu` → deploy).
