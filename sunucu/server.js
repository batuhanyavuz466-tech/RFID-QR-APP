// ============================================================
//  Masa Standi - Yonlendirme Sunucusu + Yonetim Paneli
//  /r/<slug>      -> o isletmenin Google yorum linkine 302
//  /admin         -> tarayicidan isletme ekleme/silme paneli
//  /api/...       -> panelin kullandigi uclar (yonetici anahtariyla korumali)
//  Saklanan tek veri: isletme + slug + url. Analitik YOK.
// ============================================================

const express = require("express");
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");
const { stantSvg } = require("./tasarim");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || __dirname; // kalici disk mount noktasi (Render vb.) buraya verilir
const DATA_FILE = path.join(DATA_DIR, "restoranlar.json");
const BACKUP_DIR = path.join(DATA_DIR, "yedekler");
const LOGO_DIR = path.join(DATA_DIR, "logolar");
const BACKUP_ADET = 30; // tutulacak son yedek sayisi
const PUBLIC_BASE = (process.env.BASE_URL || "").replace(/\/+$/, ""); // QR icin genel alan adi (bossa istekten turetilir)
const ADMIN_KEY = process.env.ADMIN_KEY || "admin123";               // panel sifresi (canliya almadan MUTLAKA degistir)

app.disable("x-powered-by");
app.set("trust proxy", true);
app.use(express.json({ limit: "2mb" })); // logo (base64) tasiyabilsin

// ---------------- Veri yardimcilari ----------------
let cache = { mtimeMs: 0, meta: {}, liste: [], map: new Map() };

// DATA_DIR ayri bir kalici disk ise (Render vb.) ve orada veri dosyasi henuz
// yoksa, repo ile gelen ornek dosyayi tohum (seed) olarak bir kere kopyala.
function tohumla() {
  if (DATA_DIR === __dirname) return;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DATA_FILE)) return;
  const tohumDosya = path.join(__dirname, "restoranlar.json");
  if (fs.existsSync(tohumDosya)) {
    fs.copyFileSync(tohumDosya, DATA_FILE);
    console.log(`[veri] ilk kurulum: ${tohumDosya} -> ${DATA_FILE} tohumlandi`);
  }
}

function veriOku() {
  const stat = fs.statSync(DATA_FILE);
  if (stat.mtimeMs === cache.mtimeMs) return cache; // degismemis -> onbellek
  const ham = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  const liste = Array.isArray(ham) ? ham : ham.restoranlar || [];
  const meta = Array.isArray(ham) ? {} : { ...ham, restoranlar: undefined };
  const map = new Map();
  for (const r of liste) if (r && r.slug && r.url) map.set(String(r.slug).toLowerCase(), r);
  cache = { mtimeMs: stat.mtimeMs, meta, liste, map };
  console.log(`[veri] ${map.size} isletme yuklendi (${new Date().toISOString()})`);
  return cache;
}

// Yazmadan once mevcut dosyanin zaman damgali bir kopyasini yedekler klasorune alir.
function yedekle() {
  if (!fs.existsSync(DATA_FILE)) return;
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const damga = new Date().toISOString().replace(/[:.]/g, "-");
  fs.copyFileSync(DATA_FILE, path.join(BACKUP_DIR, `restoranlar-${damga}.json`));

  const dosyalar = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith("restoranlar-") && f.endsWith(".json"))
    .sort();
  for (const f of dosyalar.slice(0, -BACKUP_ADET)) fs.unlinkSync(path.join(BACKUP_DIR, f));
}

function veriYaz(liste) {
  const { meta } = cache;
  const obj = {
    _aciklama:
      "Her isletme icin: isletme + slug + url. url = Google yorum yazma linki. Panelden (/admin) duzenlenir.",
    restoranlar: liste,
  };
  yedekle();
  // Atomic yazim: once .tmp dosyasina yaz, sonra yerine tasi (rename atomiktir).
  // Boylece yazma sirasinda sunucu coker/yeniden baslarsa dosya yarim kalip bozulmaz.
  const gecici = `${DATA_FILE}.tmp`;
  fs.writeFileSync(gecici, JSON.stringify(obj, null, 2), "utf8");
  fs.renameSync(gecici, DATA_FILE);
  cache.mtimeMs = 0; // bir sonraki okumada tazele
}

tohumla();
try { veriOku(); } catch (e) { console.error("[veri] okunamadi:", e.message); }

function slugla(s) {
  const tr = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", İ: "i" };
  return String(s || "")
    .replace(/[çğıöşüİ]/g, (c) => tr[c] || c)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function tabanUrl(req) {
  return PUBLIC_BASE || `${req.protocol}://${req.get("host")}`;
}

// ---------------- Genel uclar ----------------
app.get("/health", (_req, res) => res.json({ ok: true, isletme_sayisi: veriOku().map.size }));

app.get("/r/:slug", (req, res) => {
  const { map } = veriOku();
  const r = map.get(String(req.params.slug || "").toLowerCase());
  if (!r) return res.status(404).type("html").send(html("Baglanti bulunamadi", "Bu koda bagli isletme yok."));
  res.redirect(302, r.url);
});

app.get("/", (_req, res) =>
  res.type("html").send(html("Deger Yonlendirme", 'Calisiyor. Yonetim paneli: <a style="color:#C9A24B" href="/admin">/admin</a>'))
);

// ---------------- Yonetim paneli ----------------
app.get("/admin", (_req, res) => res.sendFile(path.join(__dirname, "public", "admin.html")));

// Anahtar kontrolu (sadece /api icin)
function yetki(req, res, next) {
  if (req.header("x-admin-key") === ADMIN_KEY) return next();
  res.status(401).json({ hata: "Yetkisiz. Yonetici anahtari yanlis." });
}

app.get("/api/restoranlar", yetki, (req, res) => {
  const { liste } = veriOku();
  res.json({ restoranlar: liste });
});

app.post("/api/restoranlar", yetki, (req, res) => {
  let { isletme, slug, url } = req.body || {};
  isletme = String(isletme || "").trim();
  url = String(url || "").trim();
  slug = slugla(slug || isletme);

  if (!isletme) return res.status(400).json({ hata: "Isletme adi bos olamaz." });
  if (!slug) return res.status(400).json({ hata: "Slug uretilemedi (isletme adini kontrol et)." });
  if (!/^https?:\/\//i.test(url)) return res.status(400).json({ hata: "url http(s):// ile baslamali." });

  const { liste } = veriOku();
  const eski = liste.find((r) => r.slug === slug);
  const yeni = liste.filter((r) => r.slug !== slug);
  const kayit = { slug, isletme, url };
  if (eski && eski.logo) kayit.logo = eski.logo; // guncellemede mevcut logoyu koru

  if (req.body.logoSil) {
    if (kayit.logo) {
      try { fs.unlinkSync(path.join(LOGO_DIR, kayit.logo)); } catch {}
      delete kayit.logo;
    }
  } else if (req.body.logo) {
    const es = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/.exec(String(req.body.logo));
    if (!es) return res.status(400).json({ hata: "Logo PNG veya JPG olmali." });
    const buf = Buffer.from(es[2], "base64");
    if (buf.length > 1.5 * 1024 * 1024) return res.status(400).json({ hata: "Logo 1.5 MB'den kucuk olmali." });
    if (!fs.existsSync(LOGO_DIR)) fs.mkdirSync(LOGO_DIR, { recursive: true });
    if (kayit.logo) { try { fs.unlinkSync(path.join(LOGO_DIR, kayit.logo)); } catch {} } // uzanti degisirse eski dosya kalmasin
    kayit.logo = `${slug}.${es[1] === "png" ? "png" : "jpg"}`;
    fs.writeFileSync(path.join(LOGO_DIR, kayit.logo), buf);
  }

  yeni.push(kayit);
  veriYaz(yeni);
  res.json({ ok: true, kayit });
});

app.delete("/api/restoranlar/:slug", yetki, (req, res) => {
  const slug = String(req.params.slug || "").toLowerCase();
  const { liste } = veriOku();
  const silinen = liste.find((r) => r.slug === slug);
  const yeni = liste.filter((r) => r.slug !== slug);
  if (yeni.length === liste.length) return res.status(404).json({ hata: "Bulunamadi." });
  if (silinen && silinen.logo) { try { fs.unlinkSync(path.join(LOGO_DIR, silinen.logo)); } catch {} }
  veriYaz(yeni);
  res.json({ ok: true });
});

// QR (PNG) - panelden indirilir. Icerik: <taban>/r/<slug>
app.get("/api/qr/:slug.png", yetki, async (req, res) => {
  const slug = slugla(req.params.slug);
  const hedef = `${tabanUrl(req)}/r/${slug}`;
  try {
    const buf = await QRCode.toBuffer(hedef, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 1200,
      color: { dark: "#000000", light: "#FFFFFF" },
    });
    res.type("png").set("Content-Disposition", `attachment; filename="${slug}.png"`).send(buf);
  } catch (e) {
    res.status(500).json({ hata: e.message });
  }
});

// Baskiya hazir masa standi (SVG) - panelden indirilir. Isletme adi + QR dinamik.
app.get("/api/tasarim/:slug.svg", yetki, async (req, res) => {
  const slug = String(req.params.slug || "").toLowerCase();
  const { map } = veriOku();
  const r = map.get(slug);
  if (!r) return res.status(404).json({ hata: "Bulunamadi." });
  try {
    const logoYolu = r.logo ? path.join(LOGO_DIR, r.logo) : null;
    const svg = await stantSvg(r.isletme || r.slug, `${tabanUrl(req)}/r/${r.slug}`, logoYolu);
    res
      .type("image/svg+xml")
      .set("Content-Disposition", `attachment; filename="${r.slug}-stant.svg"`)
      .send(svg);
  } catch (e) {
    res.status(500).json({ hata: e.message });
  }
});

function html(baslik, mesaj) {
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1"><title>${baslik}</title>
  <style>body{font-family:system-ui,Arial,sans-serif;background:#0E1726;color:#fff;display:flex;
  min-height:100vh;align-items:center;justify-content:center;margin:0;text-align:center}
  .k{max-width:420px;padding:24px}h1{color:#C9A24B;font-size:20px}p{color:#9FB0C9;line-height:1.5}</style>
  </head><body><div class="k"><h1>${baslik}</h1><p>${mesaj}</p></div></body></html>`;
}

// Dogrudan calistirildiginda dinle; require edildiginde (test) sadece app'i ver.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Sunucu ayakta: http://localhost:${PORT}`);
    console.log(`Yonetim paneli:  http://localhost:${PORT}/admin`);
    if (ADMIN_KEY === "admin123") console.log('UYARI: Yonetici anahtari varsayilan "admin123". Canliya almadan degistir (ADMIN_KEY).');
  });
}

module.exports = app;
