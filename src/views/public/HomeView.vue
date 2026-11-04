<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { useContentStore } from '@/stores/content';
import { ArrowRight, Calendar, Users, Images } from 'lucide-vue-next';

const contentStore = useContentStore();
const hero = computed(() => contentStore.homeData.hero);
const leaders = computed(() => contentStore.homeData.leaders);
const departments = computed(() => contentStore.visibleDepartments);
const recentPhotos = computed(() => contentStore.homeData.recentPhotos);
</script>

<template>
  <div class="home-view">
    <!-- BLOK 1: HERO (Dark overlay, 2 Action Buttons, Verse) -->
    <section class="hero-block">
      <div
        class="hero-bg"
        :style="{ backgroundImage: `url(${hero.featuredPhotoUrl || '/foto/backround.jpg'})` }"
        aria-hidden="true"
      ></div>
      <div class="hero-overlay" aria-hidden="true"></div>

      <div class="container hero-content">
        <span class="hero-badge">{{ hero.title }}</span>
        <h1 class="hero-title">{{ hero.slogan }}</h1>
        <p class="hero-verse">“{{ hero.verse }}” — Bernama Talitakumi sejak 1980</p>
        <p class="hero-desc">{{ hero.subSlogan }}</p>

        <div class="hero-actions">
          <RouterLink to="/program" class="btn btn-gold">
            <Calendar :size="18" aria-hidden="true" />
            <span>Lihat Program</span>
          </RouterLink>
          <RouterLink to="/galeri" class="btn btn-outline-white">
            <Images :size="18" aria-hidden="true" />
            <span>Galeri Dokumentasi</span>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- BLOK 2: PENGURUS 2024–2026 PREVIEW -->
    <section class="section-block preview-leaders">
      <div class="container">
        <div class="block-header">
          <div>
            <span class="badge badge-navy">{{ leaders.periodName }}</span>
            <h2>Kepengurusan Ranting</h2>
            <p class="section-subtitle">
              Dipimpin untuk melayani dan merawat persekutuan pemuda ranting.
            </p>
          </div>
          <RouterLink to="/pengurus" class="action-link">
            <span>Lihat semua pengurus</span>
            <ArrowRight :size="16" aria-hidden="true" />
          </RouterLink>
        </div>

        <div class="leaders-grid">
          <article v-if="leaders.ketua" class="leader-card">
            <div class="leader-avatar">
              <img
                :src="leaders.ketua.photoUrl"
                :alt="`Foto ${leaders.ketua.name}`"
                loading="lazy"
              />
            </div>
            <div class="leader-details">
              <span class="role-tag">{{ leaders.ketua.title }}</span>
              <h3 class="leader-name">{{ leaders.ketua.name }}</h3>
            </div>
          </article>

          <article v-if="leaders.sekretaris" class="leader-card">
            <div class="leader-avatar">
              <img
                :src="leaders.sekretaris.photoUrl"
                :alt="`Foto ${leaders.sekretaris.name}`"
                loading="lazy"
              />
            </div>
            <div class="leader-details">
              <span class="role-tag">{{ leaders.sekretaris.title }}</span>
              <h3 class="leader-name">{{ leaders.sekretaris.name }}</h3>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- BLOK 3: LIMA BIDANG PELAYANAN -->
    <section class="section-block bg-subtle">
      <div class="container">
        <div class="block-header">
          <div>
            <span class="badge badge-teal">Struktur Pelayanan</span>
            <h2>Lima Bidang Pelayanan</h2>
            <p class="section-subtitle">
              Sektor pelayanan AMGPM Ranting Talitakumi untuk gereja dan masyarakat.
            </p>
          </div>
          <RouterLink to="/program" class="action-link">
            <span>Lihat program kerja</span>
            <ArrowRight :size="16" aria-hidden="true" />
          </RouterLink>
        </div>

        <div class="departments-grid">
          <RouterLink
            v-for="dept in departments"
            :key="dept.id"
            to="/program"
            class="dept-card"
          >
            <div class="dept-card-media">
              <img
                v-if="dept.imageUrl"
                :src="dept.imageUrl"
                :alt="`Bidang ${dept.romanNumber} - ${dept.name}`"
                class="dept-card-img"
                loading="lazy"
              />
              <div v-else class="dept-card-placeholder">
                <span class="dept-placeholder-roman">{{ dept.romanNumber }}</span>
              </div>
              <span class="dept-badge-overlay">{{ dept.romanNumber }}</span>
            </div>
            <div class="dept-card-body">
              <span class="dept-kicker">Bidang {{ dept.romanNumber }}</span>
              <h3 class="dept-name">{{ dept.name }}</h3>
              <p v-if="dept.description" class="dept-desc">{{ dept.description }}</p>
            </div>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- BLOK 4: DOKUMENTASI TERBARU -->
    <section class="section-block">
      <div class="container">
        <div class="block-header">
          <div>
            <span class="badge badge-gold">Dokumentasi</span>
            <h2>Kebersamaan Terkini</h2>
            <p class="section-subtitle">
              Catatan visual persekutuan, ibadah, dan aksi nyata pemuda.
            </p>
          </div>
          <RouterLink to="/galeri" class="action-link">
            <span>Buka semua album</span>
            <ArrowRight :size="16" aria-hidden="true" />
          </RouterLink>
        </div>

        <div class="recent-grid">
          <div
            v-for="photo in recentPhotos"
            :key="photo.id"
            class="photo-card"
          >
            <img
              :src="photo.url"
              :alt="photo.caption || photo.originalFilename"
              loading="lazy"
            />
            <div class="photo-caption">{{ photo.caption }}</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-view {
  display: flex;
  flex-direction: column;
}

/* BLOK 1: HERO */
.hero-block {
  position: relative;
  min-height: 520px;
  display: flex;
  align-items: center;
  color: var(--white);
  padding: var(--space-12) 0;
  overflow: hidden;
}

@media (min-width: 768px) {
  .hero-block {
    min-height: 580px;
    padding: var(--space-16) 0;
  }
}

.hero-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  transform: scale(1.02);
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(8, 28, 102, 0.92) 0%,
    rgba(8, 28, 102, 0.78) 50%,
    rgba(5, 19, 71, 0.95) 100%
  );
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 760px;
}

.hero-badge {
  display: inline-block;
  padding: 6px 14px;
  background: rgba(248, 196, 95, 0.18);
  color: var(--gold);
  border: 1px solid rgba(248, 196, 95, 0.4);
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: var(--space-3);
}

.hero-title {
  color: var(--white);
  margin-bottom: var(--space-2);
  line-height: 1.15;
}

.hero-verse {
  font-size: 1.05rem;
  color: var(--gold);
  font-style: italic;
  margin-bottom: var(--space-3);
}

.hero-desc {
  font-size: 1.05rem;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.6;
  margin-bottom: var(--space-8);
  max-width: 640px;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

/* SECTION BLOCKS */
.section-block {
  padding: var(--space-10) 0;
}

@media (min-width: 768px) {
  .section-block {
    padding: var(--space-12) 0;
  }
}

.bg-subtle {
  background-color: #f0f6fc;
}

.block-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

@media (min-width: 768px) {
  .block-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-end;
  }
}

.action-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--teal);
  font-weight: 600;
  font-size: 0.95rem;
  min-height: var(--touch-target);
  transition: transform 0.2s ease, color 0.2s ease;
}

.action-link:hover {
  color: var(--navy);
  transform: translateX(3px);
}

/* BLOK 2: PENGURUS CARDS */
.leaders-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

@media (min-width: 600px) {
  .leaders-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.leader-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  background: var(--white);
  padding: var(--space-4);
  border-radius: var(--radius);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
}

.leader-avatar {
  width: 76px;
  height: 76px;
  border-radius: var(--radius);
  overflow: hidden;
  background-color: var(--navy);
  flex-shrink: 0;
}

.leader-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.leader-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.role-tag {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--teal);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.leader-name {
  font-size: 1.2rem;
  margin: 0;
  color: var(--ink);
}

/* BLOK 3: DEPARTMENTS GRID */
.departments-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
}

@media (min-width: 640px) {
  .departments-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .departments-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

.dept-card {
  background: var(--white);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-sm);
  transition: all 0.25s cubic-bezier(0.2, 0, 0, 1);
  text-decoration: none;
  color: inherit;
}

.dept-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
  border-color: var(--teal);
}

.dept-card-media {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: var(--navy);
}

.dept-card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s ease;
}

.dept-card:hover .dept-card-img {
  transform: scale(1.05);
}

.dept-card-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--navy) 0%, #1a365d 100%);
}

.dept-placeholder-roman {
  font-family: var(--font-heading);
  font-size: 2.5rem;
  color: rgba(212, 160, 23, 0.4);
  font-weight: 700;
}

.dept-badge-overlay {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  min-width: 30px;
  height: 30px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-sm);
  background: rgba(10, 26, 47, 0.88);
  backdrop-filter: blur(4px);
  color: var(--gold);
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(212, 160, 23, 0.4);
}

.dept-card-body {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  flex: 1;
}

.dept-kicker {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--teal);
  font-weight: 700;
  margin-bottom: 2px;
}

.dept-name {
  font-size: 1rem;
  font-family: var(--font-heading);
  font-weight: 700;
  color: var(--ink);
  line-height: 1.3;
  margin: 0 0 var(--space-2) 0;
}

.dept-desc {
  font-size: 0.82rem;
  color: var(--muted);
  line-height: 1.45;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* BLOK 4: RECENT PHOTOS */
.recent-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}

@media (min-width: 768px) {
  .recent-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-4);
  }
}

.photo-card {
  position: relative;
  aspect-ratio: 4/3;
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  background: var(--navy);
}

.photo-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.photo-card:hover img {
  transform: scale(1.05);
}

.photo-caption {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px 10px;
  font-size: 0.72rem;
  color: var(--white);
  background: linear-gradient(to top, rgba(0, 0, 0, 0.75) 0%, transparent 100%);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

