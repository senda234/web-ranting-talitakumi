# Web Ranting Talitakumi

Aplikasi web dinamis dan sistem administrasi (CMS) resmi **AMGPM Cabang Pniel Ranting Talitakumi**, dibangun menggunakan arsitektur modern berorientasi performa dan kemudahan pengelolaan non-teknis sesuai **Rancangan Pengembangan v1.0** dan **Rancangan Desain Ulang v2.0**.

---

## 🚀 Tumpukan Teknologi (Tech Stack)

- **Frontend:** Vue 3 (Composition API), Vite 5, TypeScript, Pinia, Vue Router 4, Lucide Icons
- **Backend / API:** Node.js dalam Vercel Serverless Functions (`/api/*`)
- **Basis Data:** Neon PostgreSQL dengan Prisma ORM
- **Media & Penyimpanan Gambar:** Cloudinary Signed Upload & CDN
- **Gaya & Token Desain:** CSS Variables (WCAG 2.2 AA Compliance, Target Sentuh $\ge 44\text{ px}$)
- **Deployment:** Vercel

---

## 🎨 Identitas Visual & Token Desain (v2.0)

Warna dan tipografi terkunci di kode untuk menjamin konsistensi visual:
- `--ink`: `#10213F` (Teks utama)
- `--muted`: `#475569` (Teks sekunder)
- `--paper`: `#F7FBFF` (Latar terang)
- `--navy`: `#081C66` (Latar gelap hero, bottom bar & footer)
- `--teal`: `#0F766E` (Aksi & tombol utama)
- `--gold`: `#F8C45F` (Aksen & penanda aktif)
- `--blue`: `#2563EB` (Cincin fokus aksesibilitas)
- **Tipografi:** *Cormorant Garamond* (Judul) & *Poppins* (Isi)

---

## 📱 Struktur Halaman

### Sisi Publik (Mobile-First):
1. **Beranda (`/`):** Tepat 4 blok (Hero dengan latar asli & 2 tombol aksi, Cuplikan Pengurus, Lima Bidang, Dokumentasi Terbaru).
2. **Sejarah (`/sejarah`):** Makna Talitakumi, Garis Waktu 6 titik interaktif yang melompat ke narasi, 7 accordion periode, dan facade video YouTube.
3. **Pengurus (`/pengurus`):** Susunan 15 pengurus aktif (5 pengurus inti + 5 bidang), foto seragam, inisial cadangan, dan tautan Instagram yang santun.
4. **Program (`/program`):** Lima bidang pelayanan dengan rincian kegiatan lengkap; format accordion terpadu pada mobile.
5. **Galeri (`/galeri` & `/galeri/:slug`):** Dokumentasi kegiatan, grid cover 4:3, Lightbox interaktif layar penuh dengan navigasi panah & Esc, serta filter berkas RAW `.CR2`.

### Sisi Admin (6 Menu Berbasis Tugas):
1. **Ringkasan (`/admin`):** 3 tombol tugas cepat + daftar "Perlu Perhatian".
2. **Galeri & Album (`/admin/galeri`):** Kelola album, unggah banyak foto, dan pilih sampul album.
3. **Pengurus (`/admin/pengurus`):** Susunan 15 slot posisi baku interaktif dengan editor data cepat.
4. **Mulai Periode Baru (`/admin/pengurus/wizard`):** Panduan 3 langkah pergantian periode kepengurusan tanpa menghapus riwayat lama.
5. **Program Kerja (`/admin/program`):** Kelola program dan kegiatan per bidang dalam satu layar.
6. **Teks Halaman (`/admin/halaman`):** Sunting teks Beranda dan Sejarah.
7. **Pengaturan (`/admin/pengaturan`):** Identitas lembaga, akun pengguna pengurus, dan log audit aktivitas.

---

## 🗄️ Arsitektur Data: Neon PostgreSQL & Cloudinary

Sistem menggunakan pemisahan tanggung jawab yang tegas antara database dan media storage:

1. **Neon PostgreSQL (Database Utama):**
   - Menjadi satu-satunya basis data relasional untuk seluruh data terstruktur: profil ranting, sejarah, periode kepengurusan, daftar pengurus, program kerja, kegiatan, album galeri, pengguna/admin, dan audit log.
   - **Path dan URL foto disimpan di Neon:**
     - `departments.image_url` &mdash; Path foto bidang pelayanan
     - `officers.photo_url` &mdash; Path foto pengurus
     - `albums.cover_url` &mdash; Path foto sampul album
     - `media_assets.secure_url` & `media_assets.cloudinary_public_id` &mdash; Metadata dan URL CDN seluruh foto dokumentasi
     - `album_media` &mdash; Relasi antara album dan foto di database

2. **Cloudinary (Penyimpanan Media & CDN Saja):**
   - Berfungsi murni sebagai tempat menampung berkas fisik gambar (blob storage) dan jaringan pengiriman konten (CDN).
   - Cloudinary **tidak** menyimpan database, tabel relasional, atau status aplikasi.
   - Saat foto diunggah dari Panel Admin, berkas diunggah langsung ke Cloudinary menggunakan tanda tangan aman (*Signed Upload*). Setelah Cloudinary mengembalikan URL CDN (`secure_url`), URL tersebut segera dikirim ke Vercel Function untuk dicatat secara permanen di database Neon PostgreSQL.

---

## 💻 Panduan Menjalankan Proyek Lokal

### 1. Prasyarat
- Node.js versi 18+ (disarankan Node v20/v24)
- npm versi 9+

### 2. Instalasi & Menjalankan Frontend
```powershell
# Jalankan server pengembangan Vite
npm.cmd run dev
```
Buka browser pada: `http://localhost:5173`

### 3. Akun Masuk Portal Pengurus
- **URL Login:** `http://localhost:5173/admin/login`
- **Email:** `admin@talitakumi.org`
- **Kata Sandi:** `admin123`

### 4. Build Produksi
```powershell
npm.cmd run build
```

---

## 🗄️ Menghubungkan Neon PostgreSQL & Cloudinary

1. Salin berkas `.env.example` menjadi `.env`:
   ```powershell
   Copy-Item .env.example .env
   ```
2. Isi connection string Neon (`DATABASE_URL` dan `DATABASE_URL_UNPOOLED`) serta kredensial Cloudinary.
3. Jalankan migrasi dan seed awal:
   ```powershell
   npx.cmd prisma migrate dev --name init
   npx.cmd prisma db seed
   ```

