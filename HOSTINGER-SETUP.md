# KONFIGURASI HOSTINGER MYSQL DAN GEMINI

Salin `server/.env.example` menjadi `server/.env`, lalu isi nilai dari panel Hostinger.

Gunakan hostname MySQL yang diberikan Hostinger pada DB_HOST. Jangan memakai localhost kecuali aplikasi Node dan MySQL memang berada pada host yang sama. Pastikan Remote MySQL mengizinkan IP server aplikasi jika koneksi dilakukan dari server berbeda.

Untuk Gemini:
- GEMINI_API_KEY dipakai bersama GEMINI_MODEL.
- GEMINI_FALLBACK_API_KEY dipakai bersama GEMINI_FALLBACK_MODEL.
- Jika GEMINI_FALLBACK_API_KEY dikosongkan, fallback otomatis memakai GEMINI_API_KEY.
- Model default sudah disesuaikan menjadi gemini-3.5-flash-lite dan gemini-3.5-flash.

MySQL mendukung DB_* dan alias MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE. Koneksi memakai keep-alive, timeout, pool, utf8mb4, dan opsi SSL.

Setelah konfigurasi, jalankan `npm install` lalu `npm start`.
