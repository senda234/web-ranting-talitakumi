# Web Ranting Talitakumi

Aplikasi web dinamis dan sistem Content Management System (CMS) resmi **AMGPM Cabang Pniel Ranting Talitakumi**, dibangun menggunakan arsitektur modern berorientasi performa, aksesibilitas tinggi, dan keamanan tingkat produksi sesuai **Rancangan Pengembangan**, **Rancangan Desain Ulang**, **Rancangan Animasi & Umpan Balik Antarmuka**, serta **Rancangan Pengelolaan User dan Sistem Keamanan**.

---

## 🚀 Tumpukan Teknologi (Tech Stack)

- **Frontend:** Vue 3 (Composition API, `<script setup>`), Vite 5, TypeScript, Pinia, Vue Router 4, Lucide Icons
- **Backend / API:** Node.js dalam Vercel Serverless Functions (`/api/*`)
- **Basis Data:** Neon PostgreSQL (Serverless Database dengan Connection Pooling) via Prisma ORM
- **Media & Penyimpanan Gambar:** Cloudinary Signed Upload & CDN (100% media Cloudinary, tanpa penyimpanan lokal)
- **Sistem Keamanan:** Sesi berbasis database Neon (SHA-256 token hash), Cookies `HttpOnly` + `Secure` + `SameSite=Lax`, Rate Limiting persisten di Neon, Bcrypt Password Hashing, Proteksi Super Admin Terakhir, Audit Log Keamanan
- **Desain & Animasi:** CSS Custom Properties (WCAG 2.2 AA Compliance, Touch Targets $\ge 44\text{ px}$, support `prefers-reduced-motion`)
- **Hosting & Deployment:** Vercel

---

## 🎨 Identitas Visual & Token Desain

Palet warna dan tipografi terkunci di sistem untuk menjamin konsistensi visual:

- `--ink`: `#10213F` (Teks utama)
- `--muted`: `#475569` (Teks sekunder)
- `--paper`: `#F7FBFF` (Latar terang)
- `--navy`: `#081C66` (Latar gelap hero, bottom bar & footer)
- `--teal`: `#0F766E` (Aksi & tombol utama)
- `--gold`: `#F8C45F` (Aksen & penanda aktif)
- `--blue`: `#2563EB` (Cincin fokus aksesibilitas)
- **Token Status:** Success (`#15803d`), Warning (`#a16207`), Error (`#b91c1c`), Info (`#1d4ed8`)
- **Tipografi:** *Cormorant Garamond* (Judul & Heading) & *Poppins* (Konten & Teks Antarmuka)

---

## 📱 Struktur Halaman

### Sisi Publik (Mobile-First & Responsif):
1. **Beranda (`/`):** Tepat 4 blok (Hero dengan foto asli & tombol aksi, Cuplikan Pengurus, Lima Bidang Pelayanan, Dokumentasi Terbaru).
2. **Sejarah Pelayanan (`/sejarah`):** Makna nama Talitakumi (Markus 5:41), Garis Waktu 6 titik interaktif yang melompat ke narasi, 7 accordion periode kepengurusan terdahulu, dan facade video YouTube hemat bandwidth.
3. **Susunan Pengurus (`/pengurus`):** Susunan 15 pengurus aktif (5 pengurus inti + 5 koordinator bidang), foto seragam, inisial cadangan, dan tautan Instagram santun.
4. **Program Kerja (`/program`):** Lima bidang pelayanan dengan status pelaksanaan kegiatan; format accordion terpadu pada layar sentuh.
5. **Galeri Dokumentasi (`/galeri` & `/galeri/:slug`):** Grid cover dokumentasi rasio 4:3, Lightbox interaktif layar penuh (navigasi panah, keyboard Esc), dan filter berkas RAW `.CR2`.

### Sisi Admin (Panel Kelola Terpadu):
1. **Ringkasan (`/admin`):** 3 tombol tugas cepat + rekap status data "Perlu Perhatian".
2. **Galeri & Album (`/admin/galeri`):** Pembuat album baru, unggah banyak foto Cloudinary secara aman (*signed upload*), serta penentuan sampul album.
3. **Pengurus (`/admin/pengurus`):** Susunan 15 slot posisi baku kepengurusan dengan formulir sunting cepat.
4. **Mulai Periode Baru (`/admin/pengurus/wizard`):** Panduan 3 langkah pergantian periode tanpa menghapus riwayat kepengurusan lama.
5. **Program Kerja (`/admin/program`):** Kelola program kerja, penanggung jawab, waktu pelaksanaan, dan anggaran dalam satu layar.
6. **Teks Halaman (`/admin/halaman`):** Sunting teks dinamis Beranda dan Sejarah.
7. **Profil Saya (`/admin/profil`):** Pergantian kata sandi tanpa memerlukan kata sandi lama, serta pengaturan profil pengguna sesuai hierarki peran.
8. **Pengaturan Sistem & Keamanan (`/admin/pengaturan`):**
   - **Tab 1: Identitas Lembaga:** Nama induk organisasi, nama cabang, dan nama ranting.
   - **Tab 2: Pengguna & Hak Akses:** Undangan pengurus baru (tautan satu kali pakai 24 jam dengan email Google), rotasi peran (Super Admin, Admin, Editor), penonaktifan akun dengan alasan, dan pencabutan sesi paksa.
   - **Tab 3: Matriks Izin Editor (Per Pengguna):** Pengaturan izin granular akses halaman per pengguna Editor (`gallery`, `officers`, `programs`, `pages`).
   - **Tab 4: Audit & Dasbor Keamanan:** 5 kartu metrik keamanan real-time, manajemen sesi perangkat aktif akun sendiri, serta tabel jejak peristiwa keamanan (*Security Events*).
9. **Aktivasi Akun Pengurus (`/admin/aktivasi`):** Halaman penautan akun Google dan aktivasi akun resmi bagi calon pengurus yang menerima undangan.

---

## 🛡️ Arsitektur Keamanan & Integrasi Google Sederhana

Sistem keamanan dirancang berlapis (*defense-in-depth*) dengan prinsip *Least Privilege* dan *Server Authoritative*:

1. **Akun Utama Super Admin Web:**
   - Super Admin adalah akun web internal utama (`admin@talitakumi.org`) yang dibuat via seeder database dan tidak bergantung pada login Google.
   - Super Admin memiliki otoritas penuh untuk mengelola pengguna, izin halaman, dan seluruh konten.
2. **Validasi Email Terverifikasi Google Saat Menambah Pengguna:**
   - Untuk mencegah pendaftaran akun dummy atau email acak/palsu, Super Admin hanya dapat mendaftarkan akun dengan format email Google resmi (`@gmail.com`).
   - Saat pengguna masuk (*login*), sistem memverifikasi identitas pengguna menggunakan Google Sign-In. Pengguna luar yang belum didaftarkan oleh Super Admin akan ditolak secara otomatis.
3. **Tiga Peran Pengurus & Matriks Izin Granular:**
   - **Super Admin:** Otoritas tertinggi sistem, tidak tampil di tabel publik pengguna biasa.
   - **Admin:** Memiliki akses ke seluruh pengelolaan konten dan dapat mengatur profil Editor.
   - **Editor:** Khusus mengelola modul konten tertentu sesuai matriks izin per pengguna (`gallery`, `officers`, `programs`, `pages`).
4. **Sesi Berbasis Database Neon PostgreSQL:**
   - Menggunakan token sesi yang tersimpan di tabel `sessions` Neon PostgreSQL dengan cookie `HttpOnly; Secure; SameSite=Lax`.
   - Pengurus dapat melihat daftar perangkat aktif dan mencabut sesi kapan saja.
   - Tidak menggunakan JWT stateless di sisi klien yang sulit dicabut.
   - Token sesi disimpan di database hanya dalam bentuk hash SHA-256. Nilai mentah token dikirim ke peramban menggunakan cookie dengan atribut `HttpOnly; Secure; SameSite=Lax`.
   - Pengurus dapat melihat daftar perangkat yang sedang aktif (IP address, jenis peramban, waktu aktif terakhir) dan mencabut sesi secara mandiri dari panel admin.
5. **Proteksi Super Admin Terakhir (*Anti-Lockout Protection*):**
   - Sistem secara otomatis menolak tindakan penghapusan, penurunan peran (*demote*), atau penonaktifan (*disable*) jika akun tersebut merupakan satu-satunya Super Admin aktif yang tersisa.
6. **Rate Limiting Persisten di Database:**
   - Pembatasan frekuensi percobaan login (maksimal 5 kali salah per 15 menit per IP/akun) untuk menahan serangan *brute force* dan *credential stuffing*.
7. **Audit Trail & Security Events:**
   - Setiap aksi penting (login Google, penautan akun, percobaan login gagal, aktivasi akun, rotasi peran, penonaktifan akun, pencabutan sesi, pengiriman email) dicatat secara terstruktur ke tabel `security_events`.

---

## 🗄️ Pemisahan Data: Neon PostgreSQL & Cloudinary

Sistem menerapkan pemisahan tanggung jawab yang bersih antara database dan aset media:

1. **Neon PostgreSQL (Database Utama):**
   - Menjadi satu-satunya sumber kebenaran (*single source of truth*) data relasional: akun pengurus, sesi aktif, profil ranting, sejarah, periode kepengurusan, daftar pengurus, program kerja, kegiatan, album galeri, aset media, token undangan, dan audit log.
   - Menyimpan URL aman Cloudinary pada field: `departments.image_url`, `officers.photo_url`, `albums.cover_url`, dan `media_assets.secure_url`.
2. **Cloudinary (Penyimpanan Media & CDN):**
   - Berfungsi murni sebagai tempat penyimpanan berkas gambar fisik dan CDN performa tinggi.
   - Pengunggahan berkas menggunakan metode **Signed Upload** melalui `/api/cloudinary/sign` sehingga API Secret Cloudinary tetap terlindungi di backend.

---

## 💻 Panduan Menjalankan Proyek Lokal

### 1. Prasyarat
- Node.js versi 20+ atau 24+
- npm versi 9+

### 2. Pemasangan Dependensi
```powershell
npm install
```

### 3. Konfigurasi Environment (`.env`)
Salin berkas `.env.example` menjadi `.env` lalu lengkapi nilai variabel berikut:
```env
# Koneksi Database Neon PostgreSQL
DATABASE_URL="postgresql://user:password@ep-sample-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://user:password@ep-sample.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# Cloudinary CDN Storage
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# URL Aplikasi
APP_URL="http://localhost:5173"
```

### 4. Sinkronisasi Skema Basis Data
```powershell
# Buat Prisma Client terbaru
npx.cmd prisma generate

# Sinkronkan skema ke database Neon
npx.cmd prisma db push
```

### 5. Menjalankan Aplikasi
```powershell
# Jalankan server frontend Vite
npm.cmd run dev
```
Buka peramban pada alamat: `http://localhost:5173`

### 6. Akses Panel Pengurus (Super Admin Utama)
- **URL Masuk:** `http://localhost:5173/admin/login`
- **Email:** `admin@talitakumi.org`
- **Kata Sandi:** `admin123` *(Dapat diganti kapan saja melalui menu Profil Saya)*
- **Pengguna Google:** Pengurus yang ditambahkan oleh Super Admin dapat masuk menggunakan tombol **Masuk dengan Google** menggunakan email `@gmail.com` yang telah didaftarkan.

### 7. Pengujian Build Produksi
```powershell
npm.cmd run build
```
Perintah di atas akan menjalankan secara berurutan: `prisma generate`, pemeriksaan tipe `vue-tsc -b`, dan kompilasi `vite build`.

---

## 📡 Daftar Endpoint API Backend (`/api/*`)

| Metode | Rute Endpoint | Otorisasi | Deskripsi |
|---|---|---|---|
| `POST` | `/api/auth/login` | Publik | Masuk pengurus dengan rate limit & pembuatan sesi database |
| `POST` | `/api/auth/logout` | Sesi Aktif | Keluar & pencabutan sesi database |
| `GET` | `/api/auth/me` | Sesi Aktif | Mengambil informasi pengguna dari sesi saat ini |
| `POST` | `/api/auth/activate` | Publik (Token) | Aktivasi akun baru & penetapan kata sandi ($\ge 12$ karakter) |
| `GET` | `/api/admin/users` | Super Admin | Mengambil daftar pengurus, status, dan jumlah sesi aktif |
| `POST` | `/api/admin/users` | Super Admin | Membuat akun undangan baru & menghasilkan URL aktivasi 24 jam |
| `PATCH` | `/api/admin/users` | Super Admin | Mengubah peran atau menonaktifkan/mengaktifkan akun pengurus |
| `DELETE` | `/api/admin/users?userId=...` | Super Admin | Mencabut paksa seluruh sesi aktif pengguna tertentu |
| `GET` | `/api/admin/security/stats` | Super Admin | Metrik keamanan sistem, statistik sesi, dan 20 audit log terbaru |
| `GET` | `/api/me/sessions` | Sesi Aktif | Mengambil daftar sesi aktif milik akun sendiri |
| `DELETE` | `/api/me/sessions?sessionId=...` | Sesi Aktif | Mencabut sesi perangkat tertentu |
| `DELETE` | `/api/me/sessions?revokeOthers=true` | Sesi Aktif | Mencabut semua sesi perangkat lain kecuali sesi saat ini |
| `POST` | `/api/cloudinary/sign` | Sesi Aktif | Menghasilkan tanda tangan upload aman untuk Cloudinary |
| `GET`/`POST` | `/api/content/[type]` | Campuran | Pengambilan dan pembaruan konten dinamis website |

---

## 📄 Lisensi & Hak Cipta

Dokumentasi dan kode sumber dikembangkan untuk **AMGPM Cabang Pniel Ranting Talitakumi**. Seluruh hak cipta dilindungi.
