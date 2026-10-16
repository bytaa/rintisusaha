# RintisUsaha MVP

Aplikasi static React/Babel untuk memetakan persiapan legalitas UMK. Riri memakai rule engine lokal untuk profil awal dan Gemini untuk pertanyaan lanjutan yang dinamis.

## Menjalankan

```bash
# buat .env dan isi GEMINI_API_KEY=<API key Anda>
npm run dev
```

Buka `http://localhost:3000`. Bila port tersebut sedang dipakai, jalankan `PORT=3456 npm run dev`.

API key hanya dibaca oleh `server/index.js`; jangan menaruhnya di HTML atau JavaScript browser.

## Supabase Auth

Isi `SUPABASE_URL` dan `SUPABASE_ANON_KEY` dari menu Connect/API Supabase. Aplikasi menyajikan dua nilai publik itu melalui `/api/config`; `service_role` atau secret key tidak boleh dimasukkan ke browser.

Halaman Akun memakai `signInWithPassword`, membuat akun baru jika email belum terdaftar, memulihkan session saat refresh, dan mendukung logout melalui Supabase Auth.

Untuk menyimpan data akun secara permanen, jalankan [supabase/schema.sql](supabase/schema.sql) di Supabase SQL Editor. Schema tersebut membuat tabel profil, profil usaha, checklist, trigger pembuatan profil, dan Row Level Security per user.

## Struktur

- `rintisusaha-mvp.html`: entrypoint dan view utama.
- `src/styles/design-system.css`: token warna, tipografi, radius, dan alias panel/control.
- `src/core/`: storage, client API Riri, dan tipe domain regulasi.
- `src/ui/`: komponen UI reusable.
- `server/index.js`: static server dan proxy Gemini `/api/riri`.

## Pengujian dan tinjauan

Jalankan `npm test`. Lihat `REVIEW-MVP.md` untuk perubahan UX, batas MVP, serta hasil verifikasi.
