# Masa Standı — Baskı & Üretim Şartnamesi (DL Dik)

Bu klasör, restoran masa standının baskıya hazır tasarım dosyalarını ve üretim
talimatlarını içerir. Kararlaştırılan format: **DL dik, premium (akrilik/UV baskı)**,
sadece Türkçe, yer tutucu marka ("MARKAMIZ").

> **Google politikası ilkesi:** Stant dili nötrdür ("Deneyiminizi Google'da paylaşın").
> Puan önceden seçilmez, yalnızca 5 yıldıza yönlendirilmez, memnuniyetsiz müşteri ayrı
> kanala süzülmez (review gating YOK). Yıldız ikonları boş/outline olarak çizilmiştir;
> müşteri puanını kendisi seçer. Bu, yorum silme/askıya alma riskini önler.

---

## 1. Dosyalar

| Dosya | Ne için |
|---|---|
| `stant-DL-on-yuz.svg` / `.pdf` | Ön yüz — ana çağrı, büyük QR, NFC dokunma alanı. Baskıya bu gider. |
| `stant-DL-arka-yuz.svg` / `.pdf` | Arka yüz — "Nasıl çalışır" 3 adım + yedek QR. |
| `*.png` | Ekran önizlemesi (baskı için kullanma, PDF/SVG kullan). |

- **Vektörel** dosyalardır; büyütünce bozulmaz. QR da vektörel (net kenar).
- Renkleri, metni, logoyu değiştirmek için `.svg` dosyalarını Illustrator/Inkscape/
  Figma ile açabilirsin.

## 2. Ölçüler (kesin)

| Öğe | Ölçü |
|---|---|
| Kesim (trim) boyutu | **100 × 210 mm** (DL dik) |
| Taşma (bleed) dahil | **106 × 216 mm** (her kenarda 3 mm) |
| Güvenli alan (safe) | kenarlardan **5 mm** içeride — önemli metin/logo bu alanda |
| Kesim/registration izleri | dört köşede, taşma bölgesinde çizili |
| QR modül boyutu (ön yüz) | **~44 mm** kare — masadan kol boyu mesafede rahat okunur |
| QR "sessiz alan" (quiet zone) | QR çevresinde beyaz panelde en az 4 modül boşluk bırakıldı |

> **Neden DL'de QR yeterli:** Okuma mesafesi masa başında ~30–50 cm. Genel kural
> "1 birim QR = ~10 birim okuma mesafesi". 44 mm QR → ~44 cm'e kadar sorunsuz.
> Standı daha uzaktan (ayakta) okutma hedefin olursa A5'e çıkmanı öneririm.

## 3. Malzeme & üretim yöntemi (premium hedefi)

| Malzeme | Görünüm / dayanım | UV baskı | Maliyet* | Not |
|---|---|---|---|---|
| **Akrilik 5 mm (öneri)** | Cam gibi, prestijli, silinebilir | Direkt UV baskı çok net | ₺₺₺ | Premium hedefe en uygun. Arkası ikinci yüz için ikinci akrilik ya da çift taraflı baskı. |
| Ahşap (MDF/kayın) | Sıcak, butik restoran havası | UV baskı + rölyef | ₺₺₺ | Ağır, sağlam durur; nem sınırı var. |
| Foreks (PVC 5–8 mm) | Hafif, ucuz, hızlı ölçeklenir | UV baskı | ₺ | Premium hissi zayıf; pilot/çok adet için mantıklı yedek. |

*Sayılar temsilîdir; kesinleştirmeden önce sana teklifleri getireceğim.*

**Yöntem önerisi (premium):** 5 mm şeffaf/opak akrilik üzerine **direkt UV baskı**
(laminasyon yerine). UV baskı çizilmeye ve suya dayanıklı, laminasyon zamanla
kenardan kalkabilir. Restoran masasında sıvı/temizlik teması yüksek olduğundan UV
baskı + akrilik en dayanıklı kombinasyon.

**Stant mekaniği:** L-şeklinde tek parça akrilik (ısıyla bükülmüş) **veya** düz plaka
+ ayrı akrilik ayak/taban. Çift yüz kullanılacaksa arkalı-önlü baskı ya da iki plaka
sırt sırta. Masada devrilmemesi için taban ağırlığı/geniş ayak iste.

## 4. NFC etiketi — yerleşim ve kritik uyarılar

- **Çip:** NTAG215 (maks. uyumluluk — iPhone/Android). Sticker (yapışkanlı) tip al.
- **Nereye:** Ön yüzdeki **"Telefonu buraya yaklaştırın" halkasının tam arkasına**
  gömülür. Kullanıcı telefonu bu daireye yaklaştırır. Görsel işaret ile fiziksel çip
  hizalı olmalı.
- **METALDEN KAÇIN (en kritik kural):** NFC metal yüzeyde çalışmaz/menzili düşer.
  - Akrilik/ahşap/foreks NFC'yi engellemez — sorun yok.
  - Stant tabanında/çerçevesinde **metal, alüminyum kompozit, metalik folyo baskı,
    metalik boya KULLANMA** (en azından çipin olduğu bölgede).
  - Zorunlu metal varsa **"on-metal" NFC etiketi** (ferrit katmanlı) kullan.
- **Gömme:** İki akrilik plaka arasına sandviçle ya da arka yüze ince bir oyuk/cep
  açıp içine yerleştir; üstünü baskı kapatır. Çip kalınlığı ~0.2 mm, panelden görünmez.
- **Yazma:** Çipe ham Google linki DEĞİL, kendi yönlendirme linkin yazılır:
  `https://deger.markamiz.com/r/<slug>` (mimari kararına uygun). Toplu yazma iş akışı
  bir sonraki adımda (02-nfc).

## 5. Baskı öncesi kontrol listesi (matbaaya vermeden)

- [ ] Renk profili **CMYK**'ye çevrildi (ekran RGB'den farklı basar).
- [ ] QR **saf siyah (K100)**, zemin beyaz; QR'a gradyan/desen/şeffaflık YOK.
- [ ] Taşma 3 mm mevcut, önemli her şey güvenli alanda (5 mm içeride).
- [ ] Yazı tipleri gömülü/outline'a çevrilmiş (PDF'te sorun olmaması için).
- [ ] Gerçek slug/PlaceID ile üretilen QR **telefonla test edildi** (bu dosyadaki QR
      örnek `ornek-restoran` linkine gider — üretimde her restorana özel QR basılır).
- [ ] NFC çipinin geleceği bölgede metalik hiçbir öğe yok.
- [ ] Numune (1 adet) onayı alınmadan toplu baskıya geçilmiyor.

## 6. Değiştirilecek yer tutucular

- `MARKAMIZ` → restoran/marka adı veya logosu (üstteki kesikli çerçeve logo alanıdır).
- Renkler: lacivert `#0E1726` + altın `#C9A24B`. Marka rengin gelince güncellerim.
- QR ve NFC linki: her restoran için `slug` bazlı üretilir (02-nfc adımında).
