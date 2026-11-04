# Rancangan Animasi dan Umpan Balik Antarmuka Web Ranting Talitakumi

**Versi dokumen:** 1.0  
**Tanggal:** 4 November 2026  
**Proyek:** Web Ranting Talitakumi  
**Frontend:** Vue 3 + Vite  
**Cakupan:** Halaman publik dan panel admin

---

## 1. Ringkasan

Dokumen ini mengatur cara aplikasi menyampaikan keadaan kepada pengguna melalui animasi, warna, ikon, teks, dan perubahan komponen. Rancangan mencakup kondisi berhasil, gagal, peringatan, informasi, loading, validasi formulir, upload foto, data kosong, sesi berakhir, akses ditolak, koneksi bermasalah, dan error halaman.

Animasi digunakan untuk membantu pengguna memahami apa yang sedang terjadi. Gerakan harus singkat, tenang, konsisten, dan tidak menghambat pekerjaan. Pesan tidak boleh hanya bergantung pada warna atau animasi. Setiap keadaan selalu disertai ikon dan teks yang jelas.

Rancangan ini melengkapi:

- `RANCANGAN_PENGEMBANGAN_WEB_RANTING_TALITAKUMI.md`;
- `RANCANGAN_MANAJEMEN_USER_ADMIN_TALITAKUMI.md`.

---

## 2. Tujuan

Sistem animasi dan umpan balik bertujuan untuk:

1. memberi tahu pengguna apakah suatu proses sedang berjalan, berhasil, atau gagal;
2. membantu pengguna memperbaiki kesalahan tanpa kebingungan;
3. mencegah pengiriman formulir atau tindakan ganda;
4. menjelaskan dampak tindakan penting;
5. menjaga pengalaman halaman publik dan admin tetap konsisten;
6. membuat upload banyak foto mudah dipantau;
7. menangani error tanpa membuat pengguna kehilangan data yang sudah diketik;
8. menjaga animasi tetap nyaman bagi pengguna yang sensitif terhadap gerakan;
9. memastikan status tetap dapat dipahami tanpa mengandalkan warna saja;
10. menjaga animasi ringan agar tidak memperlambat aplikasi Vue.

---

## 3. Prinsip Utama

### 3.1 Jelas sebelum menarik

Pesan dan tindakan perbaikan lebih penting daripada efek visual. Animasi tidak boleh menutupi informasi atau membuat pengguna menunggu tanpa alasan.

### 3.2 Satu kejadian, satu umpan balik utama

Satu tindakan tidak perlu menghasilkan toast, modal, banner, dan perubahan halaman secara bersamaan. Pilih bentuk umpan balik yang paling sesuai.

Contoh:

- menyimpan formulir berhasil: toast sukses;
- validasi field gagal: pesan inline pada field;
- sesi berakhir: dialog atau banner yang mengarahkan ke login;
- halaman gagal dimuat: error state pada area halaman;
- menghapus data: dialog konfirmasi sebelum proses dan toast setelah berhasil.

### 3.3 Gerakan menunjukkan hubungan

Animasi harus menjelaskan asal, tujuan, atau perubahan keadaan. Contohnya, toast masuk dari tepi kanan karena ditempatkan di kanan atas; baris yang dihapus memudar dan mengecil sebelum hilang.

### 3.4 Durasi singkat

Animasi kecil menggunakan durasi 120–240 ms. Perubahan panel atau modal menggunakan 200–320 ms. Hindari animasi lebih dari 500 ms kecuali indikator proses memang mengikuti durasi proses nyata.

### 3.5 Tidak menghambat interaksi

Pengguna tidak perlu menunggu animasi selesai untuk melanjutkan pekerjaan. Animasi keluar dapat dipercepat ketika tindakan berikutnya dilakukan.

### 3.6 Selalu ada alternatif nonvisual

- ikon memiliki label atau teks;
- status diumumkan melalui area `aria-live` yang sesuai;
- error field terhubung dengan `aria-describedby`;
- progress mempunyai nilai atau teks;
- warna bukan satu-satunya pembeda.

### 3.7 Hormati preferensi pengurangan gerakan

Jika perangkat menggunakan `prefers-reduced-motion: reduce`, gerakan translasi, skala, goyang, dan perputaran dekoratif dihentikan atau dipersingkat. Perubahan opacity singkat tetap dapat digunakan jika tidak mengganggu.

---

## 4. Jenis Umpan Balik

| Jenis | Warna utama | Ikon | Tujuan |
|---|---|---|---|
| Success | Hijau | Tanda centang | Menyatakan proses selesai dengan benar |
| Error | Merah | Lingkaran silang/peringatan | Menjelaskan kegagalan dan cara memperbaiki |
| Warning | Kuning/amber | Segitiga peringatan | Menjelaskan risiko sebelum atau sesudah tindakan |
| Info | Biru | Huruf i | Memberikan informasi yang perlu diketahui |
| Loading | Biru/netral | Spinner atau progress | Menunjukkan proses masih berjalan |
| Neutral | Abu-abu | Ikon sesuai konteks | Menyatakan keadaan tanpa penilaian |

Status harus menggunakan kombinasi **warna + ikon + teks**.

---

## 5. Token Warna Status

Warna final dapat disesuaikan dengan tema situs, tetapi fungsi setiap token harus tetap sama.

```css
:root {
  --status-success: #15803d;
  --status-success-bg: #f0fdf4;
  --status-success-border: #86efac;

  --status-error: #b91c1c;
  --status-error-bg: #fef2f2;
  --status-error-border: #fca5a5;

  --status-warning: #a16207;
  --status-warning-bg: #fffbeb;
  --status-warning-border: #fcd34d;

  --status-info: #1d4ed8;
  --status-info-bg: #eff6ff;
  --status-info-border: #93c5fd;

  --status-neutral: #475569;
  --status-neutral-bg: #f8fafc;
  --status-neutral-border: #cbd5e1;
}
```

### 5.1 Aturan warna

- Teks harus mempunyai kontras yang memadai terhadap latar.
- Warna status tidak menggantikan teks.
- Warna merah hanya digunakan untuk error atau tindakan berbahaya.
- Warna hijau hanya digunakan untuk keberhasilan atau status aman.
- Warning tidak boleh terlihat sama dengan error.
- Ikon memakai warna status, sedangkan teks utama tetap mudah dibaca.

---

## 6. Token Gerakan

### 6.1 Durasi

| Token | Durasi | Penggunaan |
|---|---:|---|
| `instant` | 80 ms | Perubahan sangat kecil |
| `fast` | 140 ms | Hover, focus, pressed |
| `normal` | 220 ms | Toast, dropdown, validasi |
| `moderate` | 300 ms | Modal, drawer, panel |
| `slow` | 420 ms | Transisi halaman tertentu atau ilustrasi |

### 6.2 Easing

```css
:root {
  --motion-in: cubic-bezier(0.16, 1, 0.3, 1);
  --motion-out: cubic-bezier(0.4, 0, 1, 1);
  --motion-standard: cubic-bezier(0.2, 0, 0, 1);
}
```

- `motion-in`: elemen masuk dan berhenti dengan lembut.
- `motion-out`: elemen keluar lebih cepat.
- `motion-standard`: perubahan posisi atau ukuran di dalam halaman.

### 6.3 Jarak gerakan

Gunakan jarak kecil:

- toast: 12–20 px;
- dropdown: 6–10 px;
- modal: skala dari 0,98 ke 1 atau translasi maksimal 16 px;
- pesan field: 4–8 px;
- kartu list: 8–12 px.

Hindari elemen meluncur dari jarak yang sangat jauh jika tidak memiliki hubungan spasial yang jelas.

---

## 7. Hirarki Umpan Balik

Gunakan urutan pemilihan berikut:

1. **Inline field message** untuk error input tertentu.
2. **Form summary** jika beberapa field gagal atau error berada di luar layar.
3. **Toast** untuk hasil tindakan singkat yang tidak memerlukan keputusan.
4. **Banner** untuk keadaan yang berlangsung lebih lama atau memengaruhi halaman.
5. **Dialog** untuk keputusan, error yang memblokir, atau sesi berakhir.
6. **Full-page state** jika seluruh halaman tidak dapat digunakan.

---

## 8. Toast Notification

### 8.1 Fungsi

Toast digunakan untuk mengonfirmasi hasil tindakan yang baru dilakukan, misalnya:

- data berhasil disimpan;
- foto berhasil diunggah;
- pengguna berhasil diaktifkan;
- salinan tautan berhasil dibuat;
- proses gagal tetapi pengguna masih dapat melanjutkan pekerjaan.

### 8.2 Posisi

- Desktop: kanan atas, di bawah header admin.
- Ponsel: bagian atas dengan margin kiri dan kanan.
- Maksimal tiga toast terlihat sekaligus.
- Toast baru ditambahkan ke bagian atas atau bawah secara konsisten; rekomendasi: terbaru di atas.

### 8.3 Struktur

```text
[Ikon] Judul singkat                         [Tutup]
       Penjelasan opsional
       [Aksi opsional]
```

### 8.4 Animasi masuk

- opacity: 0 → 1;
- translateY: -8 px → 0;
- desktop dapat menambahkan translateX: 12 px → 0;
- durasi: 220 ms;
- easing: `motion-in`.

### 8.5 Animasi keluar

- opacity: 1 → 0;
- translateY: 0 → -6 px;
- tinggi toast mengecil setelah opacity hampir selesai agar daftar toast bergeser lembut;
- durasi: 160 ms;
- easing: `motion-out`.

### 8.6 Durasi tampil

| Jenis | Auto-dismiss |
|---|---:|
| Success sederhana | 4 detik |
| Info | 5 detik |
| Warning | 7 detik atau manual |
| Error | Manual atau minimal 8 detik |
| Memiliki tombol aksi | Manual atau minimal 10 detik |

Timer berhenti ketika pointer berada di atas toast atau toast sedang memiliki fokus keyboard.

---

## 9. Umpan Balik Tombol

### 9.1 Hover dan focus

- perubahan warna atau elevasi dalam 140 ms;
- focus ring terlihat tanpa animasi berlebihan;
- tombol tidak berpindah posisi.

### 9.2 Pressed

- skala ringan, misalnya 0,98;
- durasi 80 ms;
- tidak digunakan pada pengguna dengan reduced motion;
- tetap mempertahankan area klik.

### 9.3 Loading button

Saat submit:

- tombol menjadi disabled;
- teks berubah menjadi kata kerja proses, misalnya “Menyimpan…”;
- spinner kecil tampil di kiri teks;
- lebar tombol dipertahankan agar layout tidak bergeser;
- tombol lain yang dapat menyebabkan konflik ikut dinonaktifkan.

### 9.4 Success button sementara

Untuk aksi kecil seperti salin tautan:

1. ikon salin berubah menjadi centang;
2. label berubah menjadi “Tersalin” selama 1,5–2 detik;
3. ikon melakukan fade atau scale halus 160 ms;
4. setelah itu kembali ke keadaan awal.

Jangan gunakan keadaan sukses sementara pada tombol submit utama jika toast dan perubahan halaman sudah cukup.

---

## 10. Validasi Formulir

### 10.1 Waktu validasi

- Validasi format sederhana dapat dilakukan setelah field kehilangan fokus.
- Saat pengguna memperbaiki field yang sudah error, validasi dapat diperbarui setelah jeda singkat.
- Seluruh field divalidasi kembali saat submit.
- Jangan menampilkan error ketika pengguna baru mengetik karakter pertama, kecuali batas karakter atau aturan langsung memang diperlukan.

### 10.2 Tampilan error field

Perubahan saat error:

- border field berubah ke warna error;
- ikon error opsional muncul di sisi kanan;
- pesan muncul di bawah field;
- `aria-invalid="true"` diterapkan;
- pesan dihubungkan menggunakan `aria-describedby`.

### 10.3 Animasi pesan field

- opacity: 0 → 1;
- translateY: -4 px → 0;
- durasi: 180 ms;
- tinggi area pesan berubah dengan transisi singkat agar field di bawah tidak meloncat tajam.

---

## 11. Alert dan Banner

### 11.1 Inline alert

Digunakan di dalam kartu, form, atau modal untuk informasi yang berkaitan langsung dengan area tersebut.

Animasi:

- fade 180 ms;
- perubahan tinggi 220 ms;
- tidak auto-dismiss.

### 11.2 Page banner

Digunakan untuk keadaan yang memengaruhi seluruh halaman:

- koneksi terputus;
- data yang ditampilkan mungkin sudah berubah;
- sesi hampir habis;
- mode read-only;
- sebagian layanan media bermasalah.

Banner masuk dari atas area konten dengan translateY -8 px dan opacity 0 → 1 selama 220 ms.

### 11.3 Global connection banner

Ketika browser offline:

```text
Anda sedang offline. Perubahan belum dapat dikirim.
```

Ketika kembali online:

```text
Koneksi kembali tersedia.
```

Banner kembali online dapat berubah menjadi success selama 3–4 detik lalu menghilang. Data form yang belum dikirim tetap dipertahankan.

---

## 12. Modal dan Dialog Konfirmasi

### 12.1 Penggunaan

Dialog digunakan untuk:

- mengonfirmasi tindakan berbahaya;
- menjelaskan konsekuensi perubahan peran;
- mengatasi konflik data;
- sesi berakhir;
- menampilkan hasil yang harus disalin sekali, seperti tautan aktivasi.

### 12.2 Animasi backdrop

- opacity: 0 → 1;
- durasi: 180 ms;
- warna hitam transparan;
- tidak menggunakan blur berat pada perangkat lemah.

### 12.3 Animasi panel dialog

- opacity: 0 → 1;
- scale: 0,98 → 1;
- translateY: 10 px → 0;
- durasi: 240 ms;
- easing: `motion-in`.

Keluar dalam 160–180 ms menggunakan `motion-out`.

---

## 13. Loading State

### 13.1 Pemilihan jenis loading

| Situasi | Komponen |
|---|---|
| Tombol melakukan request | Spinner di tombol |
| Halaman pertama kali dimuat | Skeleton |
| Tabel mengganti filter | Overlay ringan atau skeleton baris |
| Upload file | Progress bar per item |
| Proses tanpa persentase | Spinner + teks |
| Proses dengan persentase | Progress bar determinate |

---

## 27. Arsitektur Komponen Vue

Komponen yang disarankan:

```text
src/components/feedback/
├── AppToast.vue
├── ToastViewport.vue
├── InlineAlert.vue
├── PageBanner.vue
├── FieldMessage.vue
├── FormErrorSummary.vue
├── LoadingSpinner.vue
├── LoadingSkeleton.vue
├── ProgressBar.vue
├── EmptyState.vue
├── ErrorState.vue
├── ConfirmDialog.vue
├── SessionExpiredDialog.vue
└── UploadStatusCard.vue
```

State global yang diperlukan:

```text
src/stores/
├── notifications.ts
├── network.ts
└── auth.ts
```

