# Web Ranting Talitakumi

Aplikasi web dinamis dan sistem Content Management System (CMS) resmi **AMGPM Cabang Pniel Ranting Talitakumi**, dibangun menggunakan arsitektur modern berorientasi performa, aksesibilitas tinggi, dan keamanan tingkat produksi sesuai **Rancangan Pengembangan**, **Rancangan Desain Ulang**, **Rancangan Animasi & Umpan Balik Antarmuka**, serta **Rancangan Pengelolaan User dan Sistem Keamanan**.

---

## 🚀 Tumpukan Teknologi (Tech Stack)

- **Frontend:** Vue 3 (Composition API, `<script setup>`), Vite 5, TypeScript, Pinia, Vue Router 4, Lucide Icons
- **Backend / API:** Node.js dalam Vercel Serverless Functions (`/api/*`) – *Tepat 10 endpoint terkonsolidasi (kompatibel penuh dengan batas 12 Serverless Functions pada Vercel Hobby Plan)*
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
   - **Tab 2: Pengguna & Hak Akses:** Undangan pengurus baru (tautan satu kali pakai 24 jam), modal edit terpadu (ganti peran "Jadikan Editor" atau "Admin", pengaturan izin halaman, ganti sandi tanpa sandi lama, lihat & salin tautan undangan jika belum aktif), penonaktifan akun dengan alasan, pencabutan sesi paksa, serta penghapusan akun permanen.
   - **Tab 3: Audit & Dasbor Keamanan:** 5 kartu metrik keamanan real-time, manajemen sesi perangkat aktif akun sendiri, serta tabel jejak peristiwa keamanan (*Security Events*).
9. **Aktivasi Akun Pengurus (`/admin/aktivasi`):** Halaman pembuatan kata sandi langsung bagi calon pengurus yang menerima tautan undangan resmi dari Super Admin.

---

## 🛡️ Arsitektur Keamanan & Pengelolaan Pengguna

Sistem dirancang mandiri, aman, dan tanpa ketergantungan pihak ketiga yang rumit:

1. **Akun Utama Super Admin Web:**
   - Super Admin adalah akun web internal utama (`admin@talitakumi.org`) yang dibuat via seeder database Neon.
   - Super Admin memiliki otoritas penuh untuk mengelola pengguna, rotasi peran, izin halaman, dan seluruh konten.
2. **Validasi Email Saat Menambah Pengguna:**
   - Untuk mencegah pendaftaran akun palsu atau email acak, Super Admin wajib mendaftarkan alamat email resmi (`@gmail.com`).
3. **Alur Aktivasi & Login Langsung (Tanpa Google OAuth):**
   - **Tidak perlu konfigurasi Google OAuth** (tidak butuh Google Cloud Console, OAuth Client ID, OAuth Client Secret, maupun `GOOGLE_REDIRECT_URI`).
   - Super Admin membuat pengguna di menu Pengaturan, dan sistem langsung menghasilkan **Tautan Aktivasi 24 jam**.
   - Pengguna membuka tautan tersebut (`/admin/aktivasi?token=...`), membuat kata sandi baru (minimal 8 karakter), dan akun langsung aktif.
   - Pengurus masuk (*login*) langsung menggunakan email dan kata sandi yang telah dibuat.
4. **Tiga Peran Pengurus & Matriks Izin Granular:**
   - **Super Admin:** Otoritas tertinggi sistem, tidak tampil di tabel publik pengguna biasa, dapat mengelola dan menghapus akun Admin/Editor.
   - **Admin:** Memiliki akses ke seluruh pengelolaan konten dan dapat mengatur profil Editor.
   - **Editor:** Khusus mengelola modul konten tertentu sesuai centang izin halaman yang diatur Super Admin (`gallery`, `officers`, `programs`, `pages`).
5. **Sesi Berbasis Database Neon PostgreSQL:**
   - Menggunakan token sesi yang tersimpan di tabel `sessions` Neon PostgreSQL dengan cookie `HttpOnly; Secure; SameSite=Lax`.
   - Token sesi disimpan di database hanya dalam bentuk hash SHA-256.
   - Pengurus dapat melihat daftar perangkat aktif (IP address, peramban, waktu aktif terakhir) dan mencabut sesi kapan saja.
6. **Proteksi Super Admin Terakhir (*Anti-Lockout Protection*):**
   - Sistem secara otomatis menolak tindakan penghapusan, penurunan peran (*demote*), atau penonaktifan (*disable*) jika akun tersebut merupakan satu-satunya Super Admin aktif yang tersisa.
7. **Rate Limiting Persisten di Database:**
   - Pembatasan frekuensi percobaan login (maksimal 5 kali salah per 15 menit per IP/akun) untuk menahan serangan *brute force* dan *credential stuffing*.
8. **Audit Trail & Security Events:**
   - Setiap aksi penting (login berhasil, percobaan login gagal, aktivasi akun, rotasi peran, penonaktifan akun, pencabutan sesi, penghapusan akun) dicatat secara terstruktur ke tabel `security_events`.

---

## 🗄️ Pemisahan Data: Neon PostgreSQL & Cloudinary

Sistem menerapkan pemisahan tanggung jawab yang bersih antara database dan aset media:

1. **Neon PostgreSQL (Database Utama):**
   - Menjadi satu-satunya sumber kebenaran (*single source of truth*) data relasional: akun pengurus, sesi aktif, profil ranting, sejarah, periode kepengurusan, daftar pengurus, program kerja, kegiatan, album galeri, aset media, token undangan, dan audit log.
   - Menyimpan URL aman Cloudinary pada field: `departments.image_url`, `officers.photo_url`, `albums.cover_url`, dan `media_assets.secure_url`.
2. **Cloudinary (Penyimpanan Media & CDN):**
   - Berfungsi murni sebagai tempat penyimpanan berkas gambar fisik dan CDN performa tinggi.
   - Pengunggahan berkas menggunakan metode **Signed Upload** melalui `/api/admin/cloudinary/signature` sehingga API Secret Cloudinary tetap terlindungi di backend.

---

## ☁️ Panduan Deployment ke Vercel (Hobby Plan)

### 1. Apakah Perlu `GOOGLE_REDIRECT_URI` di Vercel?
> **Jawabannya: TIDAK PERLU.**
> Sistem ini menggunakan autentikasi langsung berbasis email & kata sandi dengan sesi database Neon PostgreSQL. Seluruh kode mati Google OAuth 2.0 telah dibersihkan. Anda **tidak perlu** menyetel `GOOGLE_REDIRECT_URI`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, maupun `VITE_GOOGLE_CLIENT_ID` di Vercel.

### 2. Variabel Environment yang Wajib Disetel di Vercel:
Tambahkan variabel berikut pada menu **Project Settings > Environment Variables** di Vercel:

| Nama Variabel | Nilai / Keterangan |
|---|---|
| `DATABASE_URL` | Connection string PostgreSQL ber-pool Neon (`...-pooler...sslmode=require`) |
| `DATABASE_URL_UNPOOLED` | Connection string PostgreSQL langsung Neon (tanpa pooler) |
| `AUTH_SECRET` | Kunci acak minimal 32 karakter untuk hash & keamanan sesi (contoh: string acak hex) |
| `APP_URL` | Domain publik website Anda di Vercel (misal: `https://web-ranting-talitakumi.vercel.app`) |
| `CLOUDINARY_CLOUD_NAME` | Cloud Name dari akun Cloudinary Anda |
| `CLOUDINARY_API_KEY` | API Key Cloudinary Anda |
| `CLOUDINARY_API_SECRET` | API Secret Cloudinary Anda |
| `VITE_CLOUDINARY_CLOUD_NAME` | Cloud Name Cloudinary (untuk frontend upload widget) |

### 3. Batas Serverless Function (Hobby Plan Limit)
Vercel Hobby plan membatasi maksimal 12 Serverless Functions per deployment.
Proyek ini mengonsolidasikan seluruh endpoint backend ke dalam **tepat 10 Serverless Functions**:
1. `api/admin/albums.ts` (Kelola album galeri)
2. `api/admin/departments.ts` (Kelola bidang pelayanan)
3. `api/admin/media.ts` (Kelola aset media foto)
4. `api/admin/officers.ts` (Kelola daftar pengurus & periode)
5. `api/admin/users.ts` (Kelola user: list, create invite, update role/perms, revoke sessions, delete user)
6. `api/admin/cloudinary/signature.ts` (Generate signature aman Cloudinary)
7. `api/admin/security/stats.ts` (Metrik audit & security events)
8. `api/auth.ts` (Login, logout, me, verify invitation, activate, reset password)
9. `api/me.ts` (Sesi aktif & profil akun pengurus sendiri)
10. `api/public.ts` (Endpoint publik untuk beranda, pengurus, sejarah, galeri, program)

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
Salin berkas `.env.example` menjadi `.env` lalu lengkapi nilai variabel database dan Cloudinary.

### 4. Sinkronisasi Skema Basis Data
```powershell
# Buat Prisma Client terbaru
npx prisma generate

# Sinkronkan skema ke database Neon
npx prisma db push

# (Opsional) Jalankan seeder akun Super Admin dan data awal
npm run db:seed
```

### 5. Menjalankan Aplikasi
```powershell
# Jalankan server frontend Vite
npm run dev
```
Buka peramban pada alamat: `http://localhost:5173`

### 6. Akses Panel Pengurus (Super Admin Utama)
- **URL Masuk:** `http://localhost:5173/admin/login`
- **Email:** `admin@talitakumi.org`
- **Kata Sandi:** `admin123` *(Dapat diganti kapan saja melalui menu Profil Saya atau di modal Pengaturan)*

### 7. Pengujian Build Produksi
```powershell
npm run build
```
Perintah di atas akan menjalankan secara berurutan: `prisma generate`, pemeriksaan tipe `vue-tsc -b`, dan kompilasi `vite build`.

---

## 📡 Daftar Endpoint API Backend (`/api/*`)

| Metode | Rute Endpoint | Otorisasi | Deskripsi |
|---|---|---|---|
| `POST` | `/api/auth/login` | Publik | Masuk pengurus dengan rate limit & pembuatan sesi database |
| `POST` | `/api/auth/logout` | Sesi Aktif | Keluar & pencabutan sesi database |
| `GET` | `/api/auth/me` | Sesi Aktif | Mengambil informasi pengguna dari sesi saat ini |
| `GET` | `/api/auth/verify-invitation?token=...` | Publik (Token) | Memverifikasi validitas token undangan aktivasi |
| `POST` | `/api/auth/activate` | Publik (Token) | Aktivasi akun baru & penetapan kata sandi ($\ge 8$ karakter) |
| `POST` | `/api/auth/reset-password` | Publik (Token) | Reset kata sandi menggunakan token reset |
| `GET` | `/api/admin/users` | Admin / Super Admin | Mengambil daftar pengurus, status, dan jumlah sesi aktif |
| `POST` | `/api/admin/users` | Super Admin | Membuat akun undangan baru & menghasilkan URL aktivasi 24 jam |
| `PATCH` | `/api/admin/users` | Super Admin | Mengubah peran, izin modul Editor, atau menonaktifkan akun |
| `DELETE` | `/api/admin/users?id=...&action=delete_user` | Super Admin | Menghapus akun pengguna secara permanen |
| `DELETE` | `/api/admin/users?userId=...&action=revoke_sessions` | Super Admin | Mencabut paksa seluruh sesi aktif pengguna tertentu |
| `GET` | `/api/admin/security/stats` | Super Admin | Metrik keamanan sistem, statistik sesi, dan jejak peristiwa audit |
| `GET` | `/api/me/sessions` | Sesi Aktif | Mengambil daftar sesi aktif milik akun sendiri |
| `DELETE` | `/api/me/sessions?sessionId=...` | Sesi Aktif | Mencabut sesi perangkat tertentu |
| `DELETE` | `/api/me/sessions?revokeOthers=true` | Sesi Aktif | Mencabut semua sesi perangkat lain kecuali sesi saat ini |
| `POST` | `/api/admin/cloudinary/signature` | Sesi Aktif | Menghasilkan tanda tangan upload aman untuk Cloudinary |
| `GET` | `/api/public/[resource]` | Publik | Mengambil data publik (profil, sejarah, pengurus, program, galeri) |

---

## 📄 Lisensi & Hak Cipta

Dokumentasi dan kode sumber dikembangkan untuk **AMGPM Cabang Pniel Ranting Talitakumi**. Seluruh hak cipta dilindungi.
