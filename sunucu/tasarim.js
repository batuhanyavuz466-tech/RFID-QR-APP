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

// Her sablonun dosyasi ve dinamik alanlarin yerlesimi (viewBox birimi).
// Sablonlar dik (portre) DL formatinda; viewBox 0 0 401 817.
// qr    : QR'in sol-ust kosesi ve kenar uzunlugu (sessiz alani beyaz kart saglar)
// logo  : logonun (opsiyonel) sigdirilecegi kutu, oran korunur; yoksa bos kalir
// ad    : isletme adi; kendi ayrilmis satirinda (logodan bagimsiz).
//         tek = tek satir, cift = uzun ad iki satira boluner, punto kuculur.
const SABLONLAR = {
  renkli: {
    dosya: "stant-renkli.svg",
    qr: { x: 132.28, y: 359.06, mm: 136 },
    logo: { x: 140, y: 70, w: 120, h: 46 },
    ad: {
      x: 200.3, hiza: "middle", genislik: 230, renk: "#FFFFFF",
      tek: { y: 178, tavan: 34 },
      cift: { y1: 161, y2: 182, tavan: 21 },
    },
  },
  // krem: A5 (viewBox 0 0 560 794). Dinamik alanlar: logo kutusu, ad, QR.
  krem: {
    dosya: "stant-krem.svg",
    qr: { x: 210.35, y: 316.94, mm: 135 },
    logo: { x: 222, y: 76, w: 116, h: 43 },
    ad: {
      x: 280, hiza: "middle", genislik: 290, renk: "#1B1B1F",
      tek: { y: 165, tavan: 34 },
      cift: { y1: 150, y2: 174, tavan: 22 },
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
    `font-family="'Helvetica Neue',Arial,sans-serif" font-weight="800" fill="${adCfg.renk}" ` +
    `letter-spacing="0.2">${xmlKacis(metin)}</text>`
  );
}

// Isletme adi bloku: sablondaki ayrilmis ad satirina yerlesir (logodan bagimsiz).
function adBlok(ad, adCfg) {
  ad = String(ad).trim().replace(/\s+/g, " ");
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
// sablonAdi: "renkli" (varsayilan) | "krem"  -  logoYolu opsiyoneldir.
async function stantSvg(isletme, hedefUrl, logoYolu, sablonAdi = "renkli") {
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
    .replace(/\{\{AD_BLOK\}\}/g, adBlok(isletme, cfg.ad))
    .replace(/\{\{QR\}\}/g, qrG);
}

module.exports = { stantSvg, SABLON_ADLARI: Object.keys(SABLONLAR) };
