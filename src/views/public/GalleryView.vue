<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { useContentStore } from '@/stores/content';
import { Images } from 'lucide-vue-next';

const contentStore = useContentStore();
const albums = computed(() => contentStore.publishedAlbums);
</script>

<template>
  <div class="gallery-view">
    <!-- Header -->
    <header class="page-header">
      <div class="container">
        <span class="badge badge-gold">Dokumentasi Ranting</span>
        <h1 class="page-title">Galeri Kebersamaan Talitakumi</h1>
        <p class="section-subtitle">
          Dokumentasi perjalanan pelayanan, persekutuan, dan aksi kasih AMGPM Ranting Talitakumi.
        </p>
      </div>
    </header>

    <div class="container albums-content">
      <div class="albums-grid">
        <RouterLink
          v-for="album in albums"
          :key="album.id"
          :to="`/galeri/${album.slug}`"
          class="album-card card"
        >
          <div class="album-cover">
            <img
              :src="album.coverUrl"
              :alt="`Sampul album ${album.title}`"
              loading="lazy"
            />
            <div class="album-badge-overlay">
              <span class="count-tag">{{ album.photoCount }} Foto</span>
            </div>
          </div>

          <div class="album-info">
            <span class="category-tag">
              {{ album.category === 'BIDANG' ? 'Pelayanan Bidang' : 'Kegiatan Khusus' }}
            </span>
            <h2 class="album-title">{{ album.title }}</h2>
            <p v-if="album.description" class="album-desc">{{ album.description }}</p>
          </div>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gallery-view {
  padding-bottom: var(--space-12);
}

.page-header {
  background: linear-gradient(180deg, #f0f6fc 0%, var(--paper) 100%);
  padding: var(--space-8) 0 var(--space-6);
  border-bottom: 1px solid var(--border);
  margin-bottom: var(--space-8);
}

.page-title {
  margin-top: var(--space-2);
  margin-bottom: var(--space-1);
}

.albums-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-5);
}

@media (min-width: 640px) {
  .albums-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .albums-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.album-card {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  text-decoration: none;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.album-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.album-cover {
  position: relative;
  aspect-ratio: 4/3;
  width: 100%;
  background-color: var(--navy);
  overflow: hidden;
}

.album-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s ease;
}

.album-card:hover .album-cover img {
  transform: scale(1.05);
}

.album-badge-overlay {
  position: absolute;
  top: 12px;
  right: 12px;
}

.count-tag {
  background: rgba(8, 28, 102, 0.85);
  color: var(--white);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.album-info {
  padding: var(--space-4) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.category-tag {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--teal);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.album-title {
  font-size: 1.25rem;
  margin: 0;
  color: var(--ink);
  line-height: 1.3;
}

.album-desc {
  font-size: 0.85rem;
  color: var(--muted);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-top: 2px;
}
</style>

