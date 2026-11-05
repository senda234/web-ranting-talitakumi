<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import {
  LayoutDashboard,
  Images,
  Users,
  CalendarCheck,
  FileText,
  Settings,
  ExternalLink,
  LogOut,
  Menu,
  X,
  User as UserIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const authStore = useAuthStore();
const isSidebarOpen = ref(false);

onMounted(() => {
  if (!authStore.user) {
    authStore.checkSession();
  }
});

const navItems = [
  { name: 'Ringkasan', to: '/admin', icon: LayoutDashboard },
  { name: 'Galeri & Album', to: '/admin/galeri', icon: Images },
  { name: 'Pengurus', to: '/admin/pengurus', icon: Users },
  { name: 'Program Kerja', to: '/admin/program', icon: CalendarCheck },
  { name: 'Teks Halaman', to: '/admin/halaman', icon: FileText },
  { name: 'Pengaturan', to: '/admin/pengaturan', icon: Settings },
];

const filteredNavItems = computed(() => {
  return navItems.filter((item) => {
    if (item.to === '/admin/pengaturan') {
      return authStore.canManageSettings;
    }
    if (authStore.isEditor) {
      if (item.to === '/admin/galeri') return authStore.hasPagePermission('gallery');
      if (item.to === '/admin/pengurus') return authStore.hasPagePermission('officers');
      if (item.to === '/admin/program') return authStore.hasPagePermission('programs');
      if (item.to === '/admin/halaman') return authStore.hasPagePermission('pages');
    }
    return true;
  });
});

const roleLabel = computed(() => {
  if (authStore.isSuperAdmin) return 'Super Admin';
  if (authStore.isAdmin) return 'Admin';
  return 'Editor';
});

const roleClass = computed(() => {
  if (authStore.isSuperAdmin) return 'super';
  if (authStore.isAdmin) return 'admin';
  return 'editor';
});

function isActive(path: string) {
  if (path === '/admin') {
    return route.path === '/admin';
  }
  return route.path.startsWith(path);
}

function handleLogout() {
  authStore.logout();
}
</script>

<template>
  <div class="admin-layout">
    <!-- Mobile Header -->
    <header class="admin-mobile-header">
      <button
        type="button"
        class="mobile-menu-btn"
        @click="isSidebarOpen = !isSidebarOpen"
        :aria-label="isSidebarOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'"
      >
        <X v-if="isSidebarOpen" :size="24" />
        <Menu v-else :size="24" />
      </button>

      <div class="mobile-brand">
        <span class="mobile-logo">RT</span>
        <span class="mobile-title">Panel Admin Talitakumi</span>
      </div>

      <RouterLink to="/" class="view-site-icon" title="Lihat Situs Publik">
        <ExternalLink :size="20" />
      </RouterLink>
    </header>

    <!-- Sidebar Backdrop for Mobile -->
    <div
      v-if="isSidebarOpen"
      class="sidebar-backdrop"
      @click="isSidebarOpen = false"
      aria-hidden="true"
    ></div>

    <!-- Sidebar -->
    <aside class="admin-sidebar" :class="{ 'is-open': isSidebarOpen }">
      <div class="sidebar-header">
        <div class="sidebar-brand">
          <div class="sidebar-logo">RT</div>
          <div>
            <div class="brand-name">Ranting Talitakumi</div>
            <div class="brand-sub">Panel Kelola v2.0</div>
          </div>
        </div>
      </div>

      <nav class="sidebar-nav" aria-label="Navigasi Menu Admin">
        <div class="nav-label">Menu Utama</div>
        <RouterLink
          v-for="item in filteredNavItems"
          :key="item.to"
          :to="item.to"
          class="sidebar-link"
          :class="{ 'is-active': isActive(item.to) }"
          @click="isSidebarOpen = false"
        >
          <component :is="item.icon" :size="20" class="nav-icon" aria-hidden="true" />
          <span>{{ item.name }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <RouterLink to="/admin/profil" class="footer-link" @click="isSidebarOpen = false">
          <UserIcon :size="18" />
          <span>Profil & Kata Sandi</span>
        </RouterLink>
        <a href="/" target="_blank" class="footer-link">
          <ExternalLink :size="18" />
          <span>Lihat Situs Publik</span>
        </a>
        <button type="button" class="footer-link logout-btn" @click="handleLogout">
          <LogOut :size="18" />
          <span>Keluar Portal</span>
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="admin-main-wrap">
      <!-- Desktop Topbar -->
      <header class="admin-topbar">
        <div class="topbar-left">
          <span class="topbar-indicator">Talitakumi Cloud CMS</span>
        </div>
        <div class="topbar-right">
          <a href="/" target="_blank" class="topbar-link">
            <ExternalLink :size="16" />
            <span>Lihat Situs</span>
          </a>
          <RouterLink to="/admin/profil" class="user-pill user-pill-link" title="Buka Profil & Ganti Sandi">
            <UserIcon :size="16" class="user-icon" />
            <div class="user-details-compact">
              <span class="user-name">{{ authStore.user?.name || 'Pengurus' }}</span>
              <span class="user-role-badge" :class="roleClass">
                {{ roleLabel }}
              </span>
            </div>
          </RouterLink>
          <button type="button" class="logout-icon-btn" @click="handleLogout" title="Keluar">
            <LogOut :size="18" />
          </button>
        </div>
      </header>

      <!-- Page Content -->
      <main class="admin-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  min-height: 100vh;
  display: flex;
  background-color: #f1f5f9;
  color: var(--ink);
}

/* Mobile Header */
.admin-mobile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-4);
  height: 58px;
  background-color: var(--navy);
  color: var(--white);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 40;
}

@media (min-width: 900px) {
  .admin-mobile-header {
    display: none;
  }
}

.mobile-menu-btn {
  color: var(--white);
  width: 44px;
  height: 44px;
}

.mobile-brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.mobile-logo {
  font-family: var(--font-heading);
  font-weight: 700;
  color: var(--gold);
  font-size: 1.15rem;
}

.mobile-title {
  font-size: 0.92rem;
  font-weight: 600;
}

.view-site-icon {
  color: var(--gold);
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Sidebar Backdrop */
.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 45;
}

@media (min-width: 900px) {
  .sidebar-backdrop {
    display: none;
  }
}

/* Sidebar */
.admin-sidebar {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  width: 260px;
  background-color: var(--navy);
  color: var(--white);
  display: flex;
  flex-direction: column;
  z-index: 50;
  transform: translateX(-100%);
  transition: transform 0.25s ease;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.2);
}

@media (min-width: 900px) {
  .admin-sidebar {
    transform: translateX(0);
    box-shadow: none;
  }
}

.admin-sidebar.is-open {
  transform: translateX(0);
}

.sidebar-header {
  padding: var(--space-5);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.sidebar-logo {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  background: linear-gradient(135deg, var(--teal), #054a44);
  border: 1.5px solid var(--gold);
  color: var(--white);
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.brand-name {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1.15rem;
  color: var(--white);
}

.brand-sub {
  font-size: 0.72rem;
  color: var(--teal-light);
}

.sidebar-nav {
  flex: 1;
  padding: var(--space-4) var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  overflow-y: auto;
}

.nav-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
  font-weight: 600;
  padding: var(--space-2) var(--space-3);
  letter-spacing: 0.5px;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 12px 14px;
  font-size: 0.92rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.75);
  border-radius: var(--radius-sm);
  text-decoration: none;
  transition: all 0.2s ease;
  min-height: var(--touch-target);
}

.sidebar-link:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--white);
}

.sidebar-link.is-active {
  background: rgba(248, 196, 95, 0.16);
  color: var(--gold);
  font-weight: 600;
}

.nav-icon {
  flex-shrink: 0;
}

.sidebar-footer {
  padding: var(--space-4) var(--space-3);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.footer-link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 10px 14px;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.65);
  border-radius: var(--radius-sm);
  text-decoration: none;
  min-height: var(--touch-target);
  transition: all 0.2s ease;
  width: 100%;
  text-align: left;
}

.footer-link:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--white);
}

.logout-btn {
  color: #f87171;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
}

/* Main Area */
.admin-main-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding-top: 58px;
}

@media (min-width: 900px) {
  .admin-main-wrap {
    margin-left: 260px;
    padding-top: 0;
  }
}

.admin-topbar {
  display: none;
  height: 64px;
  background-color: var(--white);
  border-bottom: 1px solid var(--border);
  padding: 0 var(--space-6);
  align-items: center;
  justify-content: space-between;
}

@media (min-width: 900px) {
  .admin-topbar {
    display: flex;
  }
}

.topbar-indicator {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--muted);
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.topbar-link {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--teal);
  text-decoration: none;
}

.topbar-link:hover {
  color: var(--navy);
}

.user-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8fafc;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border);
  font-size: 0.85rem;
  text-decoration: none;
  color: var(--ink);
  transition: all 0.2s ease;
}

.user-pill:hover {
  background: #edf2f7;
  border-color: #cbd5e1;
}

.user-details-compact {
  display: flex;
  align-items: center;
  gap: 6px;
}

.user-name {
  font-weight: 600;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-role-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.user-role-badge.super {
  background: #fef3c7;
  color: #92400e;
}

.user-role-badge.admin {
  background: #dbeafe;
  color: #1e40af;
}

.user-role-badge.editor {
  background: #e0f2fe;
  color: #0369a1;
}

.user-icon {
  color: var(--teal);
}

.logout-icon-btn {
  color: var(--muted);
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.logout-icon-btn:hover {
  color: #ef4444;
  background: #fee2e2;
}

.admin-content {
  flex: 1;
  padding: var(--space-5);
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

@media (min-width: 768px) {
  .admin-content {
    padding: var(--space-8);
  }
}
</style>

