<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

const route = useRoute();
const isScrolled = ref(false);

function handleScroll() {
  isScrolled.value = window.scrollY > 16;
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});

const navLinks = [
  { name: 'Beranda', to: '/' },
  { name: 'Sejarah', to: '/sejarah' },
  { name: 'Pengurus', to: '/pengurus' },
  { name: 'Program', to: '/program' },
  { name: 'Galeri', to: '/galeri' },
];

function isActive(path: string) {
  if (path === '/') {
    return route.path === '/';
  }
  return route.path.startsWith(path);
}
</script>

<template>
  <header class="site-header" :class="{ 'is-scrolled': isScrolled }">
    <div class="container header-inner">
      <RouterLink to="/" class="brand-link" aria-label="Ranting Talitakumi Beranda">
        <div class="brand-logo" aria-hidden="true">
          <span>RT</span>
        </div>
        <div class="brand-text">
          <span class="brand-title">Ranting Talitakumi</span>
          <span class="brand-sub">Cabang Pniel · Daerah Kota Ambon</span>
        </div>
      </RouterLink>

      <!-- Desktop Navigation -->
      <nav class="desktop-nav" aria-label="Navigasi Utama">
        <RouterLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="nav-link"
          :class="{ 'is-active': isActive(link.to) }"
        >
          {{ link.name }}
        </RouterLink>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background-color: var(--navy);
  color: var(--white);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.25s ease;
}

.site-header.is-scrolled {
  background-color: rgba(8, 28, 102, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  text-decoration: none;
  min-height: var(--touch-target);
}

.brand-logo {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-sm);
  background: linear-gradient(135deg, var(--teal) 0%, #08403d 100%);
  border: 1.5px solid var(--gold);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1.15rem;
  color: var(--white);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1.2rem;
  line-height: 1.2;
  color: var(--white);
  letter-spacing: 0.3px;
}

.brand-sub {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 0.2px;
}

/* Desktop Nav */
.desktop-nav {
  display: none;
  align-items: center;
  gap: var(--space-1);
}

@media (min-width: 768px) {
  .desktop-nav {
    display: flex;
  }
}

.nav-link {
  padding: 8px 14px;
  font-size: 0.9rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.82);
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
  min-height: var(--touch-target);
  display: inline-flex;
  align-items: center;
}

.nav-link:hover {
  color: var(--gold);
  background-color: rgba(255, 255, 255, 0.06);
}

.nav-link.is-active {
  color: var(--gold);
  background-color: rgba(248, 196, 95, 0.12);
  font-weight: 600;
}
</style>

