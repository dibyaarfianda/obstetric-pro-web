# Sehat Ibu & Bayi (obstetric-pro-web)

## Tampilan poster ilustratif

Beranda dan seluruh 10 topik menggunakan ilustrasi lokal, ikon kategori, serta blok materi visual. Logo RSUD Gambiran dan SisiWanita, alamat `sisiwanita.id` dengan jarak huruf lebar, foto dokter, dan baris footer “Supported by sisiwanita.id” termasuk dalam tampilan ini. Seluruh isi medis di `data/topics.json` dipertahankan.

- `js/artwork.js`: pemetaan poster dan deskripsi alternatif untuk beranda/detail.
- `assets/posters/`: 10 ilustrasi WebP orisinal (960 × 640); judul tetap berupa HTML.
- `assets/brands/`: logo dan foto yang diberikan pengguna.
- Desain Figma yang dapat diedit: https://www.figma.com/design/LxZ8jjTPrbg02ecE7KSUIS (beranda, gizi, dan tanda bahaya; desktop dan ponsel; 32 komponen dalam 4 keluarga).
- Pemeriksaan regresi tanpa dependensi tambahan: `node --test tests/promkes.test.cjs`.
- QA tampilan: 320, 390, 768, dan 1440 px; uji pembaruan service worker v12 → v13 dan akses materi offline.

Website publik promosi kesehatan maternal-neonatal. Dibuka lewat QR code / link di pamflet.
Mobile-first, responsive, dan berupa PWA (bisa dipasang ke layar utama dan dibaca offline).

## Stack

HTML, CSS, dan JavaScript biasa, tanpa framework dan tanpa build step.

- Ringan: halaman pertama hanya ~4 file kecil, cepat dibuka di HP dengan sinyal lemah.
- Bisa di-host di hosting statis apa pun (GitHub Pages, Netlify, Cloudflare Pages, server RS) cukup dengan menyalin folder.
- Mudah dirawat: konten topik ada di `data/topics.json`, tidak perlu menyentuh kode.

## Struktur

```
index.html              shell aplikasi (app bar, area konten, footer)
css/app.css             gaya mobile-first + breakpoint 600px dan 960px, dukung dark mode
js/app.js               router hash (#/ dan #/topik/<slug>), beranda per kategori, halaman topik, transisi, tombol Pasang, registrasi SW
js/icons.js             ikon garis SVG untuk kartu topik (dirujuk lewat field `icon`)
js/illustrations.js     piktogram kecil (PICTO, 24x24, dipakai lewat `data-ico`), dihasilkan oleh tools/build_illus.py
img/illus/               11 ilustrasi besar materi, gambar AI (JPG), dipasang oleh js/app.js lewat `<figure data-illus="...">`
data/topics.json        identitas situs (`site`), kategori (`categories`), dan topik (field `body` untuk isi materi HTML)
sw.js                   service worker: precache shell, network-first untuk halaman/data, cache-first untuk aset
manifest.webmanifest    metadata PWA
icons/                  ikon SVG, PNG 192/512, maskable, apple-touch-icon
```

## Mengubah konten

- `site.facility`: nama RS/puskesmas, tampil di footer bila diisi.
- `categories`: urutan kategori menentukan urutan bagian di beranda dan tombol Sebelumnya/Berikutnya. Warna kartu mengikuti kategori (`[data-cat]` di `css/app.css`).
- Tiap topik: `slug`, `title`, `summary`, `category` (id kategori), `icon` (nama di `js/icons.js`), `urgent: true` untuk tampil di pita "Kenali tanda bahaya", dan `body`.
- `body` berisi HTML sederhana: `<h2>` untuk sub-judul, `<ul>`/`<ol>`, `<div class="callout">` untuk kotak tips, `<div class="callout callout--danger">` untuk daftar tanda bahaya, `<div class="table-wrap"><table class="schedule">` untuk tabel jadwal, dan `<p class="source">` untuk baris acuan.
- Gambar di `body`: tambahkan `data-ico="<nama>"` pada `<li>` di dalam `<ul class="signs">` (tanda bahaya), `<ul class="pict-list">` (daftar berikon), atau `<ul class="pict-grid">` (kartu; tambah `class="ok"`/`"no"` untuk tanda ✓/✕). Ilustrasi besar: `<figure class="illus" data-illus="anc|plate|latch|cord|sleep|p4k|danger_mom|danger_baby|nifas_rest|kb_spacing|imun_shield"><figcaption>…</figcaption></figure>` — `data-illus` merujuk ke file `img/illus/<nama>.jpg`. Tahapan kunjungan: `<ol class="steps"><li><b>KF 1</b>6 jam–2 hari</li>…</ol>`. Nama piktogram kecil ada di `js/illustrations.js`; untuk menambah piktogram, ubah `tools/build_illus.py` lalu jalankan `python3 tools/build_illus.py js/illustrations.js`.
- 11 ilustrasi besar di `img/illus/` dibuat dengan image-generation AI (gaya flat vector, palet pastel per kategori), bukan foto atau ilustrasi asli pihak lain. Untuk mengganti satu topik, generate ulang gambar dengan prompt serupa (lihat riwayat PR) dan timpa file JPG-nya; tidak perlu menjalankan skrip apa pun.

## Menjalankan lokal

```
python3 -m http.server 8080
```

Buka http://localhost:8080. Service worker hanya aktif di `localhost` atau HTTPS.

## Publikasi (GitHub Pages)

Situs dipublikasikan otomatis oleh `.github/workflows/pages.yml` setiap ada push ke `main`,
ke alamat **https://promkes.dokterdibya.com/** (file `CNAME` ikut disalin; alamat lama
https://dibyaarfianda.github.io/obstetric-pro-web/ dialihkan otomatis oleh GitHub).

Aktivasi sekali saja: repo **Settings > Pages > Build and deployment > Source: GitHub Actions**.
Setelah itu jalankan workflow dari tab **Actions** (atau tunggu push berikutnya ke `main`).

Domain sendiri: record DNS `CNAME` `promkes` -> `dibyaarfianda.github.io` di pengelola DNS
`dokterdibya.com`, isi **Settings > Pages > Custom domain** dengan `promkes.dokterdibya.com`,
lalu centang **Enforce HTTPS** setelah sertifikat terbit.
Semua path di situs relatif, jadi tidak perlu mengubah kode. Buat ulang QR code setelah pindah domain.

## QR code

File siap cetak ada di `qr/`: `qr-sehat-ibu.svg` (vektor), `qr-sehat-ibu.png` (~2000 px),
dan `qr-sehat-ibu-kartu.png` (kartu 6 x 8 cm @300 dpi dengan judul dan alamat).
Buat ulang untuk alamat lain: `python3 qr/buat_qr.py https://alamat-baru/`.

## Memperbarui

Setiap kali mengubah file shell (HTML/CSS/JS/ikon), naikkan `VERSION` di `sw.js` agar pengguna mendapat versi baru.
Perubahan `data/topics.json` langsung terambil saat online (network-first).
