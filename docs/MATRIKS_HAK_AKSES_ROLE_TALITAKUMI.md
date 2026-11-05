# Matriks Hak Akses dan Izin Halaman Editor (Per Pengguna)
## Web Ranting Talitakumi

**Versi Dokumen:** 3.0  
**Tanggal:** 5 November 2026  
**Klasifikasi:** Sistem Keamanan dan Tata Kelola Peran  

---

## 1. Tata Kelola Peran (Role Governance)

Sistem Web Ranting Talitakumi membagi kewenangan pengguna ke dalam **3 Peran**:

### 1.1 `SUPER_ADMIN` (Super Administrator)
- **Metode Pembuatan:** Hanya ditambahkan melalui database seeder (`prisma/seed.ts` atau CLI). Tidak dapat didaftarkan melalui antarmuka web.
- **Karakteristik Tampilan:** **Disembunyikan dari tabel pengguna (*hidden from user table*)** untuk proteksi sistem dan menjaga kerahasiaan teknis.
- **Tingkat Akses:** **Akses Penuh Mutlak (Semua Halaman)**. Tidak memerlukan matriks konfigurasi izin karena memiliki wewenang penuh atas seluruh sistem.

### 1.2 `ADMIN` (Administrator Pengurus)
- **Metode Pembuatan:** Ditambahkan melalui undangan resmi (*Invite-Only*) oleh Super Admin.
- **Tingkat Akses:** **Akses Penuh Seluruh Modul (Semua Halaman)**. Dapat mengelola seluruh konten, struktur pengurus, program kerja, wizard periode baru, identitas organisasi, dan mengundang/mengatur Editor. Tidak memerlukan matriks izin halaman karena wewenangnya menyeluruh.

### 1.3 `EDITOR` (Editor Konten & Publikasi)
- **Metode Pembuatan:** Ditambahkan melalui undangan oleh Super Admin atau Admin.
- **Tingkat Akses:** **Granular Per Pengguna (*Per-User Page Permissions*)**.
- **Karakteristik Unik:** Meskipun dua pengguna sama-sama memiliki peran `EDITOR`, keduanya dapat memiliki izin halaman yang **berbeda**.
  - *Contoh Kasus:*
    - **Editor A (Yohana)** hanya diberi izin halaman **Kelola Galeri & Album** (`gallery`).
    - **Editor B (Petrus)** hanya diberi izin halaman **Program Kerja** (`programs`) dan **Teks Halaman** (`pages`).
    - **Editor C (Maria)** diberi izin penuh untuk seluruh konten operasional (`gallery`, `officers`, `programs`, `pages`).

---

## 2. Modul Halaman yang Dapat Dikonfigurasi untuk Editor

Terdapat 4 modul halaman operasional yang dapat diaktifkan atau dinonaktifkan secara independen untuk masing-masing Editor:

| Kunci Izin (`pageKey`) | Nama Halaman | Rute Halaman | Deskripsi Hak Akses |
|---|---|---|---|
| `gallery` | **Galeri & Album** | `/admin/galeri` | Membuat album dokumentasi, mengunggah banyak foto via Cloudinary, menentukan sampul album, dan menghapus foto. |
| `officers` | **Susunan Pengurus** | `/admin/pengurus` | Menyunting nama pengurus, jabatan, foto formal, dan kontak Instagram 15 posisi pengurus. |
| `programs` | **Program Kerja** | `/admin/program` | Menambah, menyunting, dan menghapus program kerja serta rincian kegiatan per bidang pelayanan. |
| `pages` | **Teks Halaman** | `/admin/halaman` | Memperbarui narasi dinamis Beranda dan naskah Sejarah Ranting. |

> **Catatan:**
> - Rute `/admin` (Ringkasan / Dashboard Tugas) selalu dapat diakses oleh seluruh Editor sebagai beranda awal panel kerja.
> - Halaman sistem tingkat tinggi seperti **Mulai Periode Baru (Wizard)** (`/admin/pengurus/wizard`) dan **Pengaturan Sistem** (`/admin/pengaturan`) **selalu tertutup** bagi seluruh Editor dan hanya dapat diakses oleh Super Admin & Admin.

---

## 3. Matriks Contoh Konfigurasi Izin Editor Per Pengguna

Tabel di bawah mengilustrasikan fleksibilitas perizinan independen per pengguna Editor:

| Pengguna Editor | Email | Galeri & Album (`gallery`) | Susunan Pengurus (`officers`) | Program Kerja (`programs`) | Teks Halaman (`pages`) | Dampak Tampilan Sidebar |
|---|---|:---:|:---:|:---:|:---:|---|
| **Editor A (Tim Media)** | `media@talitakumi.org` | ✅ Aktif | ❌ Tutup | ❌ Tutup | ❌ Tutup | Hanya melihat menu *Ringkasan* & *Galeri & Album*. |
| **Editor B (Sekretaris)** | `sekretariat@talitakumi.org` | ❌ Tutup | ✅ Aktif | ✅ Aktif | ✅ Aktif | Melihat menu *Ringkasan*, *Pengurus*, *Program Kerja*, dan *Teks Halaman*. |
| **Editor C (Koordinator Bidang)** | `bidang1@talitakumi.org` | ❌ Tutup | ❌ Tutup | ✅ Aktif | ❌ Tutup | Hanya melihat menu *Ringkasan* & *Program Kerja*. |
| **Editor D (Tim Publikasi Penuh)** | `publikasi@talitakumi.org` | ✅ Aktif | ✅ Aktif | ✅ Aktif | ✅ Aktif | Melihat seluruh menu konten operasional. |

---

## 4. Mekanisme Penegakan Keamanan

1. **Database Schema (`prisma/schema.prisma`):**
   - Kolom `permissions String[] @default([])` pada tabel `users` di Neon PostgreSQL menyimpan daftar kunci izin halaman secara persisten.
2. **Saat Pembuatan Undangan (`api/admin/users.ts`):**
   - Super Admin atau Admin dapat mencentang izin halaman apa saja yang langsung berlaku saat Editor mengaktivasi akunnya.
3. **Pengaturan Waktu Nyata di Panel Admin:**
   - Melalui **Pengaturan &rarr; Tab Matriks Izin Editor (Per Pengguna)**, Admin/Super Admin dapat langsung mengklik tombol sakelar izin per halaman per pengguna.
   - Perubahan langsung tersimpan ke database Neon dan berlaku seketika tanpa perlu login ulang.
4. **Proteksi Navigasi Frontend (`src/router/index.ts` & `AdminLayout.vue`):**
   - Sidebar navigasi secara otomatis menyembunyikan tautan menu yang tidak diizinkan bagi Editor tersebut.
   - Jika Editor mencoba mengakses rute terlarang secara paksa via URL address bar peramban, router guard akan memblokir dan mengembalikan pengguna ke `/admin` dengan pesan penolakan yang ramah.
