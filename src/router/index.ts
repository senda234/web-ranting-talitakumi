import { createRouter, createWebHistory } from 'vue-router';
import PublicLayout from '@/layouts/PublicLayout.vue';
import AdminLayout from '@/layouts/AdminLayout.vue';
import HomeView from '@/views/public/HomeView.vue';
import { useAuthStore } from '@/stores/auth';
import { useLoadingStore } from '@/stores/loading';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    return { top: 0, behavior: 'smooth' };
  },
  routes: [
    // PUBLIC ROUTES
    {
      path: '/',
      component: PublicLayout,
      children: [
        {
          path: '',
          name: 'home',
          component: HomeView,
          meta: { title: 'Beranda' },
        },
        {
          path: 'beranda',
          redirect: '/',
        },
        {
          path: 'sejarah',
          name: 'history',
          component: () => import('@/views/public/HistoryView.vue'),
          meta: { title: 'Sejarah Pelayanan' },
        },
        {
          path: 'pengurus',
          name: 'officers',
          component: () => import('@/views/public/OfficersView.vue'),
          meta: { title: 'Susunan Pengurus' },
        },
        {
          path: 'program',
          name: 'programs',
          component: () => import('@/views/public/ProgramsView.vue'),
          meta: { title: 'Program Kerja' },
        },
        {
          path: 'galeri',
          name: 'gallery',
          component: () => import('@/views/public/GalleryView.vue'),
          meta: { title: 'Galeri Dokumentasi' },
        },
        {
          path: 'galeri/:slug',
          name: 'album-detail',
          component: () => import('@/views/public/AlbumDetailView.vue'),
          meta: { title: 'Dokumentasi Album' },
        },
        {
          path: ':pathMatch(.*)*',
          name: 'not-found',
          component: () => import('@/views/public/NotFoundView.vue'),
          meta: { title: 'Halaman Tidak Ditemukan' },
        },
      ],
    },

    // ADMIN AUTH & ACTIVATION
    {
      path: '/admin/login',
      name: 'admin-login',
      component: () => import('@/views/admin/LoginView.vue'),
      meta: { title: 'Portal Pengurus - Masuk' },
    },
    {
      path: '/admin/aktivasi',
      name: 'admin-activation',
      component: () => import('@/views/admin/ActivationView.vue'),
      meta: { title: 'Aktivasi Akun Pengurus' },
    },

    // ADMIN PANEL (6 TASK-BASED MENUS - v2.0 §8)
    {
      path: '/admin',
      component: AdminLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'admin-dashboard',
          component: () => import('@/views/admin/DashboardView.vue'),
          meta: { title: 'Ringkasan Tugas', pageKey: 'dashboard' },
        },
        {
          path: 'galeri',
          name: 'admin-gallery',
          component: () => import('@/views/admin/GalleryAdminView.vue'),
          meta: { title: 'Kelola Galeri', pageKey: 'gallery' },
        },
        {
          path: 'pengurus',
          name: 'admin-officers',
          component: () => import('@/views/admin/OfficersAdminView.vue'),
          meta: { title: 'Susunan Pengurus', pageKey: 'officers' },
        },
        {
          path: 'pengurus/wizard',
          name: 'admin-period-wizard',
          component: () => import('@/views/admin/PeriodWizardView.vue'),
          meta: {
            title: 'Mulai Periode Baru',
            roles: ['SUPER_ADMIN', 'ADMIN'],
          },
        },
        {
          path: 'program',
          name: 'admin-programs',
          component: () => import('@/views/admin/ProgramsAdminView.vue'),
          meta: { title: 'Kelola Program', pageKey: 'programs' },
        },
        {
          path: 'halaman',
          name: 'admin-pages',
          component: () => import('@/views/admin/PagesAdminView.vue'),
          meta: { title: 'Teks Halaman', pageKey: 'pages' },
        },
        {
          path: 'pengaturan',
          name: 'admin-settings',
          component: () => import('@/views/admin/SettingsAdminView.vue'),
          meta: {
            title: 'Pengaturan',
            roles: ['SUPER_ADMIN', 'ADMIN'],
          },
        },
        {
          path: 'profil',
          name: 'admin-profile',
          component: () => import('@/views/admin/ProfileAdminView.vue'),
          meta: { title: 'Profil & Kata Sandi' },
        },
      ],
    },
  ],
});

// Navigation guard for admin protection & role-based access
router.beforeEach(async (to, from, next) => {
  if (to.path !== from.path) {
    const loadingStore = useLoadingStore();
    loadingStore.show();
  }

  if (to.matched.some((record) => record.meta.requiresAuth)) {
    const authStore = useAuthStore();
    if (!authStore.user) {
      const isValid = await authStore.checkSession();
      if (!isValid || !authStore.user) {
        next({ path: '/admin/login', query: { redirect: to.fullPath } });
        return;
      }
    }

    // 1. Role-based page guard (Super Admin & Admin only)
    const allowedRoles = to.meta.roles as string[] | undefined;
    if (allowedRoles && !allowedRoles.includes(authStore.user.role)) {
      alert('Akses Ditolak: Halaman ini hanya dapat diakses oleh Super Admin dan Admin.');
      next({ path: '/admin' });
      return;
    }

    // 2. Granular page permission guard per user for Editor
    const pageKey = to.meta.pageKey as string | undefined;
    if (pageKey && authStore.user.role === 'EDITOR') {
      if (!authStore.hasPagePermission(pageKey)) {
        alert('Akses Ditolak: Akun Editor Anda belum diberikan izin untuk mengakses halaman ini.');
        next({ path: '/admin' });
        return;
      }
    }
  }
  next();
});

router.afterEach((to) => {
  const loadingStore = useLoadingStore();
  loadingStore.hide(250);

  const baseTitle = 'AMGPM Ranting Talitakumi';
  if (to.meta.title) {
    document.title = `${to.meta.title} — ${baseTitle}`;
  } else {
    document.title = baseTitle;
  }
});

router.onError(() => {
  const loadingStore = useLoadingStore();
  loadingStore.forceHide();
});

export default router;
