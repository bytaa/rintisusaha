# Tinjauan RintisUsaha

## Perubahan yang diterapkan

- Beranda berfokus pada satu tindakan: ceritakan usaha. Panel demo teknis dihapus dari header; contoh usaha tetap tersedia.
- Revisi visual: latar netral, aksen coklat terbatas, seluruh tipografi sans-serif, dan border ringan. Riri menjadi avatar 34 px pada header chat dan 26 px pada beranda; ilustrasi besar dihapus. Form cerita usaha bisa diakses langsung dari beranda.
- Chat menyimpan konteks jawaban lanjutan, menampilkan riwayat lengkap dalam panel yang dapat digulir, membatasi pertanyaan tampil menjadi satu, dan menyediakan mulai ulang.
- Detail profil dipindahkan ke disclosure. Profil awal tidak langsung ditampilkan untuk pengunjung baru. Hasil dan checklist memerlukan cerita/profil terlebih dahulu.
- Tautan resmi langsung terbuka di tab baru. Ini navigasi ke portal, bukan integrasi akun, pengisian formulir otomatis, atau pengajuan izin.
- Riwayat percakapan dan profil disimpan di browser. Kegagalan AI memiliki jalur pengisian manual tanpa pesan konfigurasi teknis kepada pengguna.
- Input singkat yang tidak dikenali tidak lagi otomatis dianggap usaha minuman. Aktivitas di luar cakupan tidak langsung diberi label berisiko tinggi.
- Akses HTTP dibatasi ke aset publik agar file .env dan kode server tidak ikut tersaji. Permintaan AI memiliki batas waktu 25 detik.

## Kritik produk dan prioritas berikutnya

1. **Kualitas aturan lebih penting daripada banyaknya portal.** Mesin saat ini berbasis skenario, belum basis KBLI nasional. Parser menyalin sejumlah asumsi dari contoh usaha. Sebelum penggunaan publik, kumpulkan konfirmasi eksplisit untuk lokasi, bahan, masa simpan, skala, dan kegiatan utama; uji pemetaan dengan ahli perizinan. Hasil awal tetap berlabel kandidat.
2. **Jangan menyamaratakan izin pangan.** Tidak semua pangan masuk SPP-IRT. Sumber: https://sppirt.pom.go.id/faq . Periksa juga pengecualian, perubahan aturan dan penentuan akhir melalui OSS/BPOM.
3. **Pajak harus spesifik.** Fasilitas Rp500 juta pertama berkaitan dengan omzet usaha Wajib Pajak Orang Pribadi UMKM yang memenuhi ketentuan, bukan pembebasan semua pajak atau semua kewajiban pelaporan. Sumber: https://www.pajak.go.id/index.php/id/artikel/pp-202026-tarif-pph-05-bagi-umkm-orang-pribadi-berlaku-selamanya . Teks aplikasi diperjelas; ini bukan audit menyeluruh seluruh isi regulasi.
4. **Nilai untuk daerah belum lengkap.** Belum ada pemetaan dinas berdasarkan kabupaten/kota, jadwal penyuluhan, atau verifikasi persyaratan lokal. Lebih realistis memilih satu daerah pilot dan beberapa jenis usaha untuk demo yang akurat.
5. **Checklist adalah progres persiapan pengguna.** Tidak ada sinkronisasi status persetujuan OSS, SIHALAL, atau pemerintah daerah. Jangan mempresentasikannya sebagai status izin resmi.
6. **Kesiapan produksi masih perlu pekerjaan.** CDN React/Babel/Tailwind masih dipakai; perlu bundling produksi, pengendalian penyalahgunaan endpoint AI, validasi domain profil yang lebih ketat, serta tata kelola data dan pembaruan sumber regulasi.

## Verifikasi

- Empat tes aturan lulus: tiga skenario dikenal, minuman ambigu, usaha singkat di luar cakupan, dan aktivitas medis.
- Browser: beranda, panel Riri, contoh cerita, pengiriman pesan, fallback AI, dan hasil peta izin berhasil dirender.
- Lebar viewport 390 px: chat dan hasil memiliki scrollWidth 390 px (tidak melebar horizontal).
- HTTP: halaman dan gambar 200; .env dan server/index.js 404.
- Respons AI langsung belum berhasil saat pengujian. Jalur fallback terverifikasi; kualitas jawaban AI dan perubahan profil lintas giliran belum terverifikasi end-to-end.
