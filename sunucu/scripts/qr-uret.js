// ============================================================
//  QR Uretici
//  restoranlar.json'daki her isletme icin QR uretir.
//  QR icerigi: <BASE_URL>/r/<slug>  (ham Google linki DEGIL!)
//  Cikti: cikti-qr/<slug>.png, <slug>.svg ve <slug>-stant-<sablon>.svg
//  (stant = baskiya hazir masa standi; sablonlar: dik, yatay)
//
//  Kullanim:
//    BASE_URL=https://deger.markamiz.com node scripts/qr-uret.js
//  (BASE_URL vermezsen varsayilan asagidaki DEFAULT kullanilir)
// ============================================================

const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");
const { stantSvg, SABLON_ADLARI } = require("../tasarim");

const DEFAULT_BASE = "https://deger.markamiz.com";
const BASE_URL = (process.env.BASE_URL || DEFAULT_BASE).replace(/\/+$/, "");

const DATA_FILE = path.join(__dirname, "..", "restoranlar.json");
const OUT_DIR = path.join(__dirname, "..", "cikti-qr");
const LOGO_DIR = path.join(__dirname, "..", "logolar");

async function main() {
  const ham = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  const liste = Array.isArray(ham) ? ham : ham.restoranlar || [];
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const secenek = {
    errorCorrectionLevel: "H", // yuksek hata duzeltme (logo eklenirse dayanikli)
    margin: 2,                 // sessiz alan (quiet zone)
    color: { dark: "#000000", light: "#FFFFFF" }, // saf siyah/beyaz - maks kontrast
  };

  let n = 0;
  for (const r of liste) {
    if (!r || !r.slug) continue;
    const hedef = `${BASE_URL}/r/${r.slug}`;

    const png = path.join(OUT_DIR, `${r.slug}.png`);
    const svg = path.join(OUT_DIR, `${r.slug}.svg`);

    await QRCode.toFile(png, hedef, { ...secenek, width: 1200 }); // baski icin yuksek cozunurluk
    const svgStr = await QRCode.toString(hedef, { ...secenek, type: "svg" });
    fs.writeFileSync(svg, svgStr);

    // baskiya hazir masa stantlari (isletme adi + logo + QR dinamik)
    const logoYolu = r.logo ? path.join(LOGO_DIR, r.logo) : null;
    for (const sablon of SABLON_ADLARI) {
      const stant = path.join(OUT_DIR, `${r.slug}-stant-${sablon}.svg`);
      fs.writeFileSync(stant, await stantSvg(r.isletme || r.slug, hedef, logoYolu, sablon));
    }

    console.log(`✓ ${r.slug.padEnd(20)} -> ${hedef}`);
    n++;
  }
  console.log(`\n${n} QR uretildi -> ${OUT_DIR}`);
  console.log(`BASE_URL = ${BASE_URL}`);
  if (BASE_URL === DEFAULT_BASE) {
    console.log("Not: Gercek alan adin farkliysa: BASE_URL=https://alanadin.com node scripts/qr-uret.js");
  }
}

main().catch((e) => {
  console.error("Hata:", e.message);
  process.exit(1);
});
