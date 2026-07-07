// ============================================================
//  Tanitim sayfasi onizlemeleri
//  sablonlar/ altindaki tum sablonlari ornek verilerle doldurup
//  public/assets/ornek-stant-<sablon>.svg olarak kaydeder.
//  Sablonlarda degisiklik yaptiktan sonra calistir:
//    node scripts/onizleme-uret.js
// ============================================================

const fs = require("fs");
const path = require("path");
const { stantSvg, SABLON_ADLARI } = require("../tasarim");

const ORNEK_AD = "İşletmeniz";
const ORNEK_URL = "https://www.instagram.com/artibiryorum"; // ornek QR ziyaretcisi bize ulassin
const CIKTI_DIZIN = path.join(__dirname, "..", "public", "assets");

(async () => {
  fs.mkdirSync(CIKTI_DIZIN, { recursive: true });
  for (const sablon of SABLON_ADLARI) {
    const svg = await stantSvg(ORNEK_AD, ORNEK_URL, null, sablon);
    const dosya = path.join(CIKTI_DIZIN, `ornek-stant-${sablon}.svg`);
    fs.writeFileSync(dosya, svg, "utf8");
    console.log(`[onizleme] ${dosya} (${(svg.length / 1024).toFixed(0)} KB)`);
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
