# 📂 File Reader

<p align="center"><img src="icons/icon-512.png" width="160" alt="FILE READER"></p>

Aplikasi web **pembaca dokumen** yang simpel. Semua file dibaca langsung di browser, jadi **tidak ada file yang diunggah ke server**.

## ✨ Format yang didukung

| Jenis | Ekstensi |
|---|---|
| Word | `.docx` |
| Excel | `.xlsx`, `.xls`, `.xlsm`, `.ods` |
| CSV | `.csv` |
| PowerPoint | `.pptx` (teks & gambar per slide) |
| PDF | `.pdf` |
| Arsip | `.zip`, `.rar` (bisa buka file di dalamnya) |
| Teks / kode | `.txt`, `.md`, `.json`, `.xml`, `.html`, `.js`, `.py`, `.sql`, `.log`, dll |
| Gambar | `.png`, `.jpg`, `.gif`, `.webp`, `.svg`, `.bmp` |
| Audio / Video | `.mp3`, `.wav`, `.ogg`, `.mp4`, `.webm` |

> Format lama `.doc` dan `.ppt` belum didukung — simpan ulang sebagai `.docx` / `.pptx`.

## 🚀 Cara pakai

1. Buka `index.html` di browser (atau versi GitHub Pages).
2. Klik **Buka File** atau seret & lepas file ke halaman.

## 🌐 Publikasi ke GitHub Pages

1. Buat repository baru di GitHub, misalnya `file-reader`.
2. Upload semua isi folder ini (`index.html`, `style.css`, `app.js`, `manifest.json`, folder `icons/`).
3. Buka **Settings → Pages**, pilih **Branch: main** dan folder **/ (root)**, lalu **Save**.
4. Aplikasi bisa diakses di `https://USERNAME.github.io/file-reader/`.

Lewat terminal:

```bash
git init
git add .
git commit -m "File Reader"
git branch -M main
git remote add origin https://github.com/USERNAME/file-reader.git
git push -u origin main
```

## 📁 Struktur

```
file-reader/
├── index.html
├── style.css
├── app.js
├── manifest.json
├── README.md
└── icons/
    ├── icon.svg
    ├── icon-192.png
    └── icon-512.png
```

## 🧩 Library yang dipakai (via CDN)

- [PDF.js](https://mozilla.github.io/pdf.js/) — PDF
- [Mammoth.js](https://github.com/mwilliamson/mammoth.js) — Word
- [SheetJS](https://sheetjs.com/) — Excel & CSV
- [JSZip](https://stuk.github.io/jszip/) — ZIP & PowerPoint
- [node-unrar-js](https://github.com/YuJianrong/node-unrar.js) — RAR

Butuh koneksi internet saat pertama dibuka untuk memuat library.

## 📄 Lisensi

MIT
