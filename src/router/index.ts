import { createRouter, createWebHistory } from 'vue-router';
import PublicLayout from '@/layouts/PublicLayout.vue';
import AdminLayout from '@/layouts/AdminLayout.vue';
import HomeView from '@/views/public/HomeView.vue';

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

    // ADMIN AUTH
    {
      path: '/admin/login',
      name: 'admin-login',
      component: () => import('@/views/admin/LoginView.vue'),
      meta: { title: 'Portal Pengurus - Masuk' },
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
          meta: { title: 'Ringkasan Tugas' },
        },
        {
          path: 'galeri',
          name: 'admin-gallery',
          component: () => import('@/views/admin/GalleryAdminView.vue'),
          meta: { title: 'Kelola Galeri' },
        },
        {
          path: 'pengurus',
          name: 'admin-officers',
          component: () => import('@/views/admin/OfficersAdminView.vue'),
          meta: { title: 'Susunan Pengurus' },
        },
        {
          path: 'pengurus/wizard',
          name: 'admin-period-wizard',
          component: () => import('@/views/admin/PeriodWizardView.vue'),
          meta: { title: 'Mulai Periode Baru' },
        },
        {
          path: 'program',
          name: 'admin-programs',
          component: () => import('@/views/admin/ProgramsAdminView.vue'),
          meta: { title: 'Kelola Program' },
        },
        {
          path: 'halaman',
          name: 'admin-pages',
          component: () => import('@/views/admin/PagesAdminView.vue'),
          meta: { title: 'Teks Halaman' },
        },
        {
          path: 'pengaturan',
          name: 'admin-settings',
          component: () => import('@/views/admin/SettingsAdminView.vue'),
          meta: { title: 'Pengaturan' },
        },
      ],
    },
  ],
});

// Navigation guard for admin protection
router.beforeEach((to, from, next) => {
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    const isAuth = localStorage.getItem('talitakumi_admin_auth');
    if (!isAuth) {
      next({ path: '/admin/login', query: { redirect: to.fullPath } });
      return;
    }
  }
  next();
});

router.afterEach((to) => {
  const baseTitle = 'AMGPM Ranting Talitakumi';
  if (to.meta.title) {
    document.title = `${to.meta.title} — ${baseTitle}`;
  } else {
    document.title = baseTitle;
  }
});

export default router;
