<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { useContentStore } from '@/stores/content';
import { ArrowLeft, X, ChevronLeft, ChevronRight } from 'lucide-vue-next';
import type { ArchivePhotoItem } from '@/data/albumPhotos';

const route = useRoute();
const contentStore = useContentStore();

const albumSlug = computed(() => route.params.slug as string);
const album = computed(() => contentStore.getAlbumBySlug(albumSlug.value));

// Lightbox state
const activePhotoIndex = ref<number | null>(null);
const lastFocusedEl = ref<HTMLElement | null>(null);

function openLightbox(index: number, event: MouseEvent) {
  lastFocusedEl.value = event.currentTarget as HTMLElement;
  activePhotoIndex.value = index;
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  activePhotoIndex.value = null;
  document.body.style.overflow = '';
  if (lastFocusedEl.value) {
    lastFocusedEl.value.focus();
  }
}

function nextPhoto() {
  if (!album.value) return;
  if (activePhotoIndex.value !== null) {
    activePhotoIndex.value = (activePhotoIndex.value + 1) % album.value.photos.length;
  }
}

function prevPhoto() {
  if (!album.value) return;
  if (activePhotoIndex.value !== null) {
    activePhotoIndex.value =
      (activePhotoIndex.value - 1 + album.value.photos.length) % album.value.photos.length;
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (activePhotoIndex.value === null) return;
  if (e.key === 'Escape') {
    closeLightbox();
  } else if (e.key === 'ArrowRight') {
    nextPhoto();
  } else if (e.key === 'ArrowLeft') {
    prevPhoto();
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  document.body.style.overflow = '';
});
</script>

<template>
  <div class="album-detail-view">
    <div v-if="!album" class="container not-found-album">
      <h2>Album Tidak Ditemukan</h2>
      <p>Album yang Anda cari tidak tersedia atau belum dipublikasikan.</p>
      <RouterLink to="/galeri" class="btn btn-primary">Kembali ke Galeri</RouterLink>
    </div>

    <template v-else>
      <!-- Header -->
      <header class="album-header">
        <div class="container">
          <RouterLink to="/galeri" class="back-link">
            <ArrowLeft :size="18" aria-hidden="true" />
            <span>Kembali ke Galeri</span>
          </RouterLink>

          <div class="header-main">
            <div>
              <span class="badge badge-navy">
                {{ album.category === 'BIDANG' ? 'Dokumentasi Bidang' : 'Kegiatan Khusus' }}
              </span>
              <h1 class="album-page-title">{{ album.title }}</h1>
              <p v-if="album.description" class="album-summary">{{ album.description }}</p>
            </div>
            <div class="photo-stats">
              <strong>{{ album.photoCount }}</strong>
              <span>Foto Tersimpan</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Photos Grid -->
      <div class="container photos-grid-wrap">
        <div class="photos-grid">
          <button
            v-for="(photo, idx) in album.photos"
            :key="photo.id"
            type="button"
            class="photo-item-btn"
            @click="openLightbox(idx, $event)"
            :aria-label="`Buka foto ${idx + 1}`"
          >
            <img
              :src="photo.url"
              :alt="photo.altText"
              loading="lazy"
              class="thumb-img"
            />
            <div class="photo-hover-overlay" aria-hidden="true">
              <span>Perbesar</span>
            </div>
          </button>
        </div>
      </div>

      <!-- LIGHTBOX MODAL -->
      <div
        v-if="activePhotoIndex !== null"
        class="lightbox-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Penampil Foto Layar Penuh"
        @click.self="closeLightbox"
      >
        <div class="lightbox-toolbar">
          <div class="counter">
            {{ activePhotoIndex + 1 }} / {{ album.photos.length }}
          </div>
          <button
            type="button"
            class="close-btn"
            @click="closeLightbox"
            aria-label="Tutup penampil foto (Esc)"
          >
            <X :size="24" />
          </button>
        </div>

        <button
          type="button"
          class="nav-btn prev-btn"
          @click.stop="prevPhoto"
          aria-label="Foto sebelumnya (Panah Kiri)"
        >
          <ChevronLeft :size="32" />
        </button>

        <div class="lightbox-content" @click.self="closeLightbox">
          <img
            :src="album.photos[activePhotoIndex].url"
            :alt="album.photos[activePhotoIndex].altText"
            class="lightbox-img"
          />
        </div>

        <button
          type="button"
          class="nav-btn next-btn"
          @click.stop="nextPhoto"
          aria-label="Foto berikutnya (Panah Kanan)"
        >
          <ChevronRight :size="32" />
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.album-detail-view {
  padding-bottom: var(--space-12);
}

.album-header {
  background: linear-gradient(180deg, #f0f6fc 0%, var(--paper) 100%);
  padding: var(--space-6) 0 var(--space-8);
  border-bottom: 1px solid var(--border);
  margin-bottom: var(--space-8);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--teal);
  font-weight: 600;
  font-size: 0.9rem;
  min-height: var(--touch-target);
  margin-bottom: var(--space-4);
  transition: transform 0.2s ease;
}

.back-link:hover {
  transform: translateX(-3px);
}

.header-main {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

@media (min-width: 768px) {
  .header-main {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-end;
  }
}

.album-page-title {
  margin: var(--space-2) 0 var(--space-1);
}

.album-summary {
  font-size: 0.95rem;
  color: var(--muted);
}

.photo-stats {
  display: flex;
  flex-direction: column;
  background: var(--white);
  padding: 10px 18px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  text-align: center;
  width: fit-content;
}

.photo-stats strong {
  font-family: var(--font-heading);
  font-size: 1.6rem;
  color: var(--navy);
  line-height: 1.1;
}

.photo-stats span {
  font-size: 0.75rem;
  color: var(--muted);
  text-transform: uppercase;
}

/* PHOTO GRID */
.photos-grid-wrap {
  margin-top: var(--space-4);
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}

@media (min-width: 680px) {
  .photos-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-4);
  }
}

@media (min-width: 1024px) {
  .photos-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.photo-item-btn {
  position: relative;
  aspect-ratio: 1 / 1;
  width: 100%;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background-color: #cbd5e1;
  padding: 0;
  border: none;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
}

.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.25s ease;
}

.photo-item-btn:hover .thumb-img {
  transform: scale(1.06);
}

.photo-hover-overlay {
  position: absolute;
  inset: 0;
  background: rgba(8, 28, 102, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.photo-hover-overlay span {
  color: var(--white);
  font-size: 0.8rem;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.6);
  padding: 4px 10px;
  border-radius: var(--radius-full);
}

.photo-item-btn:hover .photo-hover-overlay,
.photo-item-btn:focus-visible .photo-hover-overlay {
  opacity: 1;
}

/* LIGHTBOX */
.lightbox-modal {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(5, 12, 38, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}

.lightbox-toolbar {
  position: absolute;
  top: 16px;
  left: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 10;
}

.counter {
  color: var(--white);
  font-size: 0.95rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.15);
  padding: 6px 14px;
  border-radius: var(--radius-full);
}

.close-btn {
  background: rgba(255, 255, 255, 0.15);
  color: var(--white);
  border-radius: 50%;
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.12);
  color: var(--white);
  width: 48px;
  height: 48px;
  min-width: 48px;
  min-height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: background 0.2s ease;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.prev-btn {
  left: 16px;
}

.next-btn {
  right: 16px;
}

.lightbox-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 70px;
}

.lightbox-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: var(--radius-sm);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.not-found-album {
  text-align: center;
  padding: var(--space-16) var(--space-4);
}
</style>

