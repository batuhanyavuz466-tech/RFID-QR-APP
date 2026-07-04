// ============================================================
//  Tasarim uretici
//  sablonlar/stant-dl-on.svg sablonunu isletmeye ozel doldurur:
//  isletme adi + QR dinamik, geri kalan tasarim sabittir.
//  Hem scripts/qr-uret.js hem server.js (/api/tasarim) kullanir.
// ============================================================

const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");

const SABLON_DOSYA = path.join(__dirname, "sablonlar", "stant-dl-on.svg");

// QR'in sablondaki yeri: 64 mm'lik beyaz kartin ortasinda 44x44 mm.
// Kartin kendisi ~10 mm sessiz alan sagladigi icin QR margin'siz uretilir.
const QR_X = 31, QR_Y = 84.5, QR_MM = 44;

// Isletme adi bloku: uzun ad ortadaki bosluktan iki satira bolunur,
// punto sigacak sekilde kuculur; QR ve yerlesim asla degismez.
// ~80 mm guvenli genislik / (0.62 x punto) mm ortalama karakter genisligi.
const AD_GENISLIK = 80, AD_KAT = 0.62;

function siganPunto(uzunluk, tavan) {
  return Math.max(2.6, Math.min(tavan, AD_GENISLIK / (AD_KAT * Math.max(uzunluk, 1))));
}

function adSatir(metin, taban, punto) {
  return (
    `  <text x="53" y="${taban}" text-anchor="middle" font-size="${punto}" ` +
    `font-weight="800" fill="#1B1B1F" letter-spacing="0.2">${xmlKacis(metin)}</text>`
  );
}

// Opsiyonel logo: ust alanda 34x12 mm kutuya orani koruyarak sigdirilir.
// SVG'ye data URI olarak gomulur; boylece cikti tek dosya kalir.
const LOGO_X = 36, LOGO_Y = 18.5, LOGO_W = 34, LOGO_H = 12;

function logoBlok(logoYolu) {
  if (!logoYolu || !fs.existsSync(logoYolu)) return "";
  const mime = path.extname(logoYolu).toLowerCase() === ".png" ? "image/png" : "image/jpeg";
  const b64 = fs.readFileSync(logoYolu).toString("base64");
  return (
    `  <image x="${LOGO_X}" y="${LOGO_Y}" width="${LOGO_W}" height="${LOGO_H}" ` +
    `preserveAspectRatio="xMidYMid meet" href="data:${mime};base64,${b64}"/>`
  );
}

function adBlok(ad, logoluMu) {
  ad = String(ad).trim().replace(/\s+/g, " ");
  if (logoluMu) {
    // logo ust alani kapladigi icin ad tek satir, logonun hemen altinda
    return adSatir(ad, 35.5, siganPunto(ad.length, 5).toFixed(2));
  }
  const tekPunto = siganPunto(ad.length, 7.5);
  if (tekPunto >= 5 || !ad.includes(" ")) {
    return adSatir(ad, 30, tekPunto.toFixed(2));
  }
  // ortaya en yakin bosluktan iki satira bol
  const orta = ad.length / 2;
  let bolme = -1;
  for (const es of ad.matchAll(/ /g)) {
    if (bolme < 0 || Math.abs(es.index - orta) < Math.abs(bolme - orta)) bolme = es.index;
  }
  const satir1 = ad.slice(0, bolme).trim();
  const satir2 = ad.slice(bolme + 1).trim();
  const punto = siganPunto(Math.max(satir1.length, satir2.length), 6).toFixed(2);
  return adSatir(satir1, 26.5, punto) + "\n" + adSatir(satir2, 33.5, punto);
}

function xmlKacis(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Baskiya hazir stant SVG'si (string) dondurur. logoYolu opsiyoneldir.
async function stantSvg(isletme, hedefUrl, logoYolu) {
  const sablon = fs.readFileSync(SABLON_DOSYA, "utf8");
  const logo = logoBlok(logoYolu);

  const qr = await QRCode.toString(hedefUrl, {
    errorCorrectionLevel: "H", // yuksek hata duzeltme
    margin: 0,                 // sessiz alani sablondaki beyaz panel sagliyor
    type: "svg",
    color: { dark: "#000000", light: "#ffffff" },
  });
  // Ic <svg>'yi <g transform>'a cevir: ic ice svg'yi bazi cizim motorlari
  // (resvg, kimi matbaa RIP'leri) desteklemez; <g> her yerde calisir.
  const boyut = parseFloat(qr.match(/viewBox="0 0 (\d+(?:\.\d+)?)/)[1]);
  const ic = qr.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  const qrG =
    `<g transform="translate(${QR_X},${QR_Y}) scale(${(QR_MM / boyut).toFixed(6)})" ` +
    `shape-rendering="crispEdges">${ic}</g>`;

  return sablon
    .replace(/\{\{LOGO_BLOK\}\}/g, () => logo)
    .replace(/\{\{AD_BLOK\}\}/g, adBlok(isletme, !!logo))
    .replace(/\{\{QR\}\}/g, qrG);
}

module.exports = { stantSvg };
