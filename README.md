# Sehat Ibu & Bayi (obstetric-pro-web)

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

## Menjalankan lokal

```
python3 -m http.server 8080
```

Buka http://localhost:8080. Service worker hanya aktif di `localhost` atau HTTPS.

## Memperbarui

Setiap kali mengubah file shell (HTML/CSS/JS/ikon), naikkan `VERSION` di `sw.js` agar pengguna mendapat versi baru.
Perubahan `data/topics.json` langsung terambil saat online (network-first).
