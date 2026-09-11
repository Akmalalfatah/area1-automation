# eKPI Automation — Node.js/Express

Dashboard eKPI untuk upload satu file KPI, kalkulasi KPI per NOP, history berdasarkan tanggal, filter dashboard, preventive management, ekspor Excel, dan AI Report dari prompt kustom.

## Stack

- Server tunggal: Node.js 20+ dan Express
- Excel: ExcelJS
- Web UI: React + Tailwind (disajikan sebagai static files oleh Express)
- History opsional: Hostinger MySQL melalui package `mysql2`
- AI Report: Gemini REST API dengan primary dan fallback model

Project ini **tidak lagi menggunakan Python, FastAPI, Uvicorn, openpyxl, atau psycopg**. Frontend dan API berjalan dalam satu proses Node sehingga cukup dideploy sebagai satu web service.

## Menjalankan

1. Install Node.js 20+.
2. Salin `server/.env.example` menjadi `server/.env`.
3. Isi minimal `GEMINI_API_KEY` agar AI Report dapat dibuat.
4. Jalankan:

```bash
npm install
npm start
```

Atau pada Windows cukup jalankan `run.bat`. Buka `http://127.0.0.1:8000`.

## Environment

```env
PORT=8000
HOST=127.0.0.1
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-2.5-flash-lite
GEMINI_FALLBACK_MODEL=gemini-2.5-flash

# Opsional untuk history lintas perangkat pada Hostinger
DB_HOST=localhost
DB_PORT=3306
DB_USER=u123456789_user
DB_PASSWORD=kata_sandi_database
DB_NAME=u123456789_kpi
USE_DATABASE=true
```

Tanpa database, upload, pemrosesan KPI, dashboard, dan generate AI Report tetap berjalan. History bersama dan preventive upload memerlukan MySQL. Schema tersedia di `server/sql/schema.mysql.sql` dan dibuat otomatis saat koneksi database tersedia.

## Generate prompt/report

Prompt bawaan dikirim oleh endpoint `GET /api/config`. Pengguna dapat mengeditnya dari AI Report Configuration; prompt tersebut dikirim ke `POST /api/runs/:id/report`. Express menghitung dataset analisis, memasukkannya sebagai data terstruktur, lalu memanggil Gemini langsung dari server. API key tidak pernah dikirim ke browser.

Model utama dicoba maksimal tiga kali. Bila gagal, server mencoba `GEMINI_FALLBACK_MODEL`. Dengan demikian alur generate report sebelumnya tetap dipertahankan tanpa FastAPI.

## Struktur proyek

```text
server/
  index.js          Express routes dan static hosting
  services.js       parsing KPI, kalkulasi, analisis, Gemini
  preventive.js     parsing dan dashboard preventive
  db.js             integrasi MySQL/Hostinger
  constants.js      mapping NOP, row KPI, default prompt
  templates/        template export Excel
  sql/              schema database
web/
  src/              source React/Tailwind
  static/           build yang langsung disajikan Express
data/runs/           file runtime per upload
```

## Build frontend (opsional)

Build statis yang siap jalan sudah tersedia. Jika source React/Tailwind diubah:

```bash
cd web
npm install
npm run build
```

## Endpoint yang dipertahankan

Kontrak frontend lama tetap dipakai: run creation/upload/process, dashboard, report, history, preventive upload/dashboard, serta export XLSX. Karena URL API tetap sama, frontend tidak membutuhkan perubahan untuk migrasi ini.

## Catatan deployment gratis

Gunakan satu layanan Node.js dengan build command `npm install` dan start command `npm start`. Folder `data/runs` bersifat lokal/temporer pada banyak platform gratis; gunakan MySQL Hostinger bila history harus bertahan setelah restart atau redeploy.
