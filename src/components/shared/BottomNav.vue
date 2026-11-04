<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router';
import { Home, BookOpen, Users, CalendarCheck, Images } from 'lucide-vue-next';

const route = useRoute();

const items = [
  { name: 'Beranda', to: '/', icon: Home },
  { name: 'Sejarah', to: '/sejarah', icon: BookOpen },
  { name: 'Pengurus', to: '/pengurus', icon: Users },
  { name: 'Program', to: '/program', icon: CalendarCheck },
  { name: 'Galeri', to: '/galeri', icon: Images },
];

function isActive(path: string) {
  if (path === '/') {
    return route.path === '/';
  }
  return route.path.startsWith(path);
}
</script>

<template>
  <nav class="bottom-nav" aria-label="Navigasi Bawah Ponsel">
    <div class="bottom-nav-inner">
      <RouterLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="nav-item"
        :class="{ 'is-active': isActive(item.to) }"
      >
        <component :is="item.icon" class="nav-icon" :size="20" aria-hidden="true" />
        <span class="nav-label">{{ item.name }}</span>
      </RouterLink>
    </div>
  </nav>
</template>

<style scoped>
.bottom-nav {
  display: block;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background-color: var(--navy);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.2);
}

@media (min-width: 768px) {
  .bottom-nav {
    display: none;
  }
}

.bottom-nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: 58px;
  max-width: 500px;
  margin: 0 auto;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  flex: 1;
  height: 100%;
  min-height: var(--touch-target);
  color: rgba(255, 255, 255, 0.65);
  text-decoration: none;
  transition: all 0.2s ease;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.nav-icon {
  transition: transform 0.2s ease, color 0.2s ease;
}

.nav-label {
  font-size: 0.68rem;
  font-weight: 500;
  letter-spacing: 0.2px;
}

.nav-item:hover {
  color: rgba(255, 255, 255, 0.9);
}

.nav-item.is-active {
  color: var(--gold);
}

.nav-item.is-active .nav-icon {
  transform: translateY(-1px);
  stroke: var(--gold);
}
</style>

