<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { useContentStore } from '@/stores/content';
import {
  PlusCircle,
  Users,
  FileEdit,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Images,
} from 'lucide-vue-next';

const contentStore = useContentStore();

const activePeriod = computed(() => contentStore.activePeriod);
const draftAlbums = computed(() =>
  contentStore.albums.filter((a) => a.status === 'DRAFT')
);
const albumsWithoutCover = computed(() =>
  contentStore.albums.filter((a) => !a.coverUrl)
);
const hiddenOfficers = computed(() =>
  contentStore.officers.filter((o) => !o.isVisible)
);
</script>

<template>
  <div class="admin-dashboard">
    <div class="dash-welcome">
      <div>
        <h1 class="dash-title">Ringkasan Pelayanan</h1>
        <p class="dash-subtitle">
          Selamat datang di panel administrasi Ranting Talitakumi. Pilih tugas cepat di bawah ini.
        </p>
      </div>
      <div class="active-pill">
        <span>Periode Aktif:</span>
        <strong>{{ activePeriod.name }}</strong>
      </div>
    </div>

    <!-- TIGA TOMBOL TUGAS CEPAT (v2.0 §8.2) -->
    <section class="quick-tasks-section">
      <h2 class="section-title">Tugas Cepat</h2>
      <div class="tasks-grid">
        <RouterLink to="/admin/galeri" class="task-card card">
          <div class="task-icon-wrap teal">
            <PlusCircle :size="28" />
          </div>
          <div class="task-info">
            <h3 class="task-name">Tambah / Kelola Album</h3>
            <p class="task-desc">Unggah foto kegiatan baru dan atur dokumentasi album.</p>
          </div>
          <ArrowRight :size="20" class="task-arrow" />
        </RouterLink>

        <RouterLink to="/admin/pengurus" class="task-card card">
          <div class="task-icon-wrap navy">
            <Users :size="28" />
          </div>
          <div class="task-info">
            <h3 class="task-name">Ubah Susunan Pengurus</h3>
            <p class="task-desc">Perbarui data 15 pengurus inti dan bidang atau mulai periode baru.</p>
          </div>
          <ArrowRight :size="20" class="task-arrow" />
        </RouterLink>

        <RouterLink to="/admin/halaman" class="task-card card">
          <div class="task-icon-wrap gold">
            <FileEdit :size="28" />
          </div>
          <div class="task-info">
            <h3 class="task-name">Ubah Teks Halaman</h3>
            <p class="task-desc">Sesuaikan slogan, ayat Alkitab, alamat, atau narasi sejarah.</p>
          </div>
          <ArrowRight :size="20" class="task-arrow" />
        </RouterLink>
      </div>
    </section>

    <!-- DAFTAR PERLU PERHATIAN (v2.0 §8.2) -->
    <section class="attention-section">
      <h2 class="section-title">Daftar Perlu Perhatian</h2>
      <div class="attention-card card">
        <div v-if="draftAlbums.length === 0 && albumsWithoutCover.length === 0" class="attention-clean">
          <CheckCircle :size="24" class="clean-icon" />
          <div>
            <strong>Semua data teratur dengan baik!</strong>
            <p>Tidak ada draf tertunda atau album tanpa foto sampul.</p>
          </div>
        </div>

        <div v-else class="attention-items">
          <div v-for="album in draftAlbums" :key="album.id" class="attention-item warn">
            <AlertCircle :size="20" class="item-icon" />
            <div class="item-body">
              <strong>Album Draf: {{ album.title }}</strong>
              <p>Album ini belum dipublikasikan ke situs publik.</p>
            </div>
            <RouterLink :to="`/admin/galeri`" class="btn btn-sm btn-outline">
              Buka Album
            </RouterLink>
          </div>

          <div v-for="album in albumsWithoutCover" :key="album.id" class="attention-item warn">
            <Images :size="20" class="item-icon" />
            <div class="item-body">
              <strong>Belum ada sampul: {{ album.title }}</strong>
              <p>Pilih salah satu foto untuk dijadikan sampul album ini.</p>
            </div>
            <RouterLink :to="`/admin/galeri`" class="btn btn-sm btn-outline">
              Pilih Sampul
            </RouterLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.admin-dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.dash-welcome {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

@media (min-width: 768px) {
  .dash-welcome {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-end;
  }
}

.dash-title {
  font-size: 2rem;
  margin: 0;
}

.dash-subtitle {
  color: var(--muted);
  font-size: 0.95rem;
  margin-top: 4px;
}

.active-pill {
  background: var(--white);
  padding: 8px 16px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border);
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
}

.active-pill strong {
  color: var(--teal);
}

.section-title {
  font-size: 1.25rem;
  margin-bottom: var(--space-4);
  color: var(--ink);
}

/* TASKS GRID */
.tasks-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

@media (min-width: 800px) {
  .tasks-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.task-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-decoration: none;
  gap: var(--space-3);
  padding: var(--space-6);
  position: relative;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.task-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}

.task-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
}

.task-icon-wrap.teal {
  background: rgba(15, 118, 110, 0.12);
  color: var(--teal);
}

.task-icon-wrap.navy {
  background: rgba(8, 28, 102, 0.12);
  color: var(--navy);
}

.task-icon-wrap.gold {
  background: rgba(248, 196, 95, 0.25);
  color: #a16207;
}

.task-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.task-name {
  font-size: 1.15rem;
  font-family: var(--font-body);
  font-weight: 600;
  color: var(--ink);
  margin: 0;
}

.task-desc {
  font-size: 0.85rem;
  color: var(--muted);
  line-height: 1.4;
}

.task-arrow {
  color: var(--teal);
  margin-top: auto;
  align-self: flex-end;
  transition: transform 0.2s ease;
}

.task-card:hover .task-arrow {
  transform: translateX(4px);
}

/* ATTENTION SECTION */
.attention-card {
  padding: var(--space-5);
}

.attention-clean {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: #15803d;
}

.clean-icon {
  flex-shrink: 0;
}

.attention-clean p {
  font-size: 0.85rem;
  color: var(--muted);
  margin: 0;
}

.attention-items {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.attention-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: 12px 16px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: var(--radius-sm);
}

.item-icon {
  color: #b45309;
  flex-shrink: 0;
}

.item-body {
  flex: 1;
}

.item-body strong {
  font-size: 0.92rem;
  color: #92400e;
}

.item-body p {
  font-size: 0.8rem;
  color: #78350f;
  margin: 2px 0 0;
}

.btn-sm {
  padding: 6px 14px;
  font-size: 0.8rem;
  min-height: 36px;
}
</style>

