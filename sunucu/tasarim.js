// ============================================================
//  Tasarim uretici
//  sablonlar/ altindaki SVG sablonlarini isletmeye ozel doldurur:
//  isletme adi + logo + QR dinamik, geri kalan tasarim sabittir.
//  Hem scripts/qr-uret.js hem server.js (/api/tasarim) kullanir.
// ============================================================

const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");

const SABLON_DIZIN = path.join(__dirname, "sablonlar");

// Her sablonun dosyasi ve dinamik alanlarin yerlesimi (mm, viewBox birimi).
// qr    : QR'in sol-ust kosesi ve kenar uzunlugu (sessiz alani beyaz kart saglar)
// logo  : logonun sigdirilecegi kutu (oran korunur)
// ad    : isletme adi; logolu = logo varken tek satir, tek/cift = logosuz yerlesim
const SABLONLAR = {
  dik: {
    dosya: "stant-dl-on.svg",
    qr: { x: 31, y: 84.5, mm: 44 },
    logo: { x: 36, y: 18.5, w: 34, h: 12 },
    ad: {
      x: 53, hiza: "middle", genislik: 80, renk: "#1B1B1F",
      logolu: { y: 35.5, tavan: 5 },
      tek: { y: 30, tavan: 7.5 },
      cift: { y1: 26.5, y2: 33.5, tavan: 6 },
    },
  },
  yatay: {
    dosya: "stant-yatay.svg",
    qr: { x: 96, y: 28, mm: 38 },
    logo: { x: 15, y: 13, w: 42, h: 14 },
    ad: {
      x: 15, hiza: "start", genislik: 55, renk: "#FFFFFF",
      logolu: { y: 32.5, tavan: 4.5 },
      tek: { y: 21.5, tavan: 6.5 },
      cift: { y1: 17.5, y2: 24.5, tavan: 5 },
    },
  },
};

// Punto: verilen genislige sigacak sekilde kuculur (asla tasmaz).
// genislik / (0.62 x punto) mm ortalama karakter genisligi varsayimi.
function siganPunto(uzunluk, tavan, genislik) {
  return Math.max(2.6, Math.min(tavan, genislik / (0.62 * Math.max(uzunluk, 1))));
}

function xmlKacis(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function adSatir(metin, taban, punto, adCfg) {
  return (
    `  <text x="${adCfg.x}" y="${taban}" text-anchor="${adCfg.hiza}" font-size="${punto}" ` +
    `font-weight="800" fill="${adCfg.renk}" letter-spacing="0.2">${xmlKacis(metin)}</text>`
  );
}

function adBlok(ad, logoluMu, adCfg) {
  ad = String(ad).trim().replace(/\s+/g, " ");
  if (logoluMu) {
    // logo ust alani kapladigi icin ad tek satir, logonun hemen altinda
    const p = siganPunto(ad.length, adCfg.logolu.tavan, adCfg.genislik);
    return adSatir(ad, adCfg.logolu.y, p.toFixed(2), adCfg);
  }
  const tekPunto = siganPunto(ad.length, adCfg.tek.tavan, adCfg.genislik);
  if (tekPunto >= adCfg.cift.tavan * 0.85 || !ad.includes(" ")) {
    return adSatir(ad, adCfg.tek.y, tekPunto.toFixed(2), adCfg);
  }
  // ortaya en yakin bosluktan iki satira bol
  const orta = ad.length / 2;
  let bolme = -1;
  for (const es of ad.matchAll(/ /g)) {
    if (bolme < 0 || Math.abs(es.index - orta) < Math.abs(bolme - orta)) bolme = es.index;
  }
  const satir1 = ad.slice(0, bolme).trim();
  const satir2 = ad.slice(bolme + 1).trim();
  const punto = siganPunto(Math.max(satir1.length, satir2.length), adCfg.cift.tavan, adCfg.genislik).toFixed(2);
  return adSatir(satir1, adCfg.cift.y1, punto, adCfg) + "\n" + adSatir(satir2, adCfg.cift.y2, punto, adCfg);
}

// Opsiyonel logo: kutuya orani koruyarak sigdirilir.
// SVG'ye data URI olarak gomulur; boylece cikti tek dosya kalir.
function logoBlok(logoYolu, kutu) {
  if (!logoYolu || !fs.existsSync(logoYolu)) return "";
  const mime = path.extname(logoYolu).toLowerCase() === ".png" ? "image/png" : "image/jpeg";
  const b64 = fs.readFileSync(logoYolu).toString("base64");
  return (
    `  <image x="${kutu.x}" y="${kutu.y}" width="${kutu.w}" height="${kutu.h}" ` +
    `preserveAspectRatio="xMidYMid meet" href="data:${mime};base64,${b64}"/>`
  );
}

// Baskiya hazir stant SVG'si (string) dondurur.
// sablonAdi: "dik" (varsayilan) | "yatay"  -  logoYolu opsiyoneldir.
async function stantSvg(isletme, hedefUrl, logoYolu, sablonAdi = "dik") {
  const cfg = SABLONLAR[sablonAdi];
  if (!cfg) throw new Error(`Bilinmeyen sablon: ${sablonAdi}`);
  const sablon = fs.readFileSync(path.join(SABLON_DIZIN, cfg.dosya), "utf8");
  const logo = logoBlok(logoYolu, cfg.logo);

  const qr = await QRCode.toString(hedefUrl, {
    errorCorrectionLevel: "H", // yuksek hata duzeltme
    margin: 0,                 // sessiz alani sablondaki beyaz kart sagliyor
    type: "svg",
    color: { dark: "#000000", light: "#ffffff" },
  });
  // Ic <svg>'yi <g transform>'a cevir: ic ice svg'yi bazi cizim motorlari
  // (resvg, kimi matbaa RIP'leri) desteklemez; <g> her yerde calisir.
  const boyut = parseFloat(qr.match(/viewBox="0 0 (\d+(?:\.\d+)?)/)[1]);
  const ic = qr.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  const qrG =
    `<g transform="translate(${cfg.qr.x},${cfg.qr.y}) scale(${(cfg.qr.mm / boyut).toFixed(6)})" ` +
    `shape-rendering="crispEdges">${ic}</g>`;

  return sablon
    .replace(/\{\{LOGO_BLOK\}\}/g, () => logo)
    .replace(/\{\{AD_BLOK\}\}/g, adBlok(isletme, !!logo, cfg.ad))
    .replace(/\{\{QR\}\}/g, qrG);
}

module.exports = { stantSvg, SABLON_ADLARI: Object.keys(SABLONLAR) };
