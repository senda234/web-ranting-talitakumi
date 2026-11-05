import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import router from '@/router';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR';
  permissions?: string[];
  status: 'INVITED' | 'PENDING_ACTIVATION' | 'ACTIVE' | 'DISABLED';
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null);
  const isLoading = ref(false);
  const isInitialized = ref(false);

  const isAuthenticated = computed(() => !!user.value);
  const isSuperAdmin = computed(() => user.value?.role === 'SUPER_ADMIN');
  const isAdmin = computed(() => user.value?.role === 'ADMIN');
  const isEditor = computed(() => user.value?.role === 'EDITOR');

  // Hak akses per fungsionalitas
  const canManageSettings = computed(() => isSuperAdmin.value || isAdmin.value);
  const canManageUsers = computed(() => isSuperAdmin.value || isAdmin.value);
  const canAccessWizard = computed(() => isSuperAdmin.value || isAdmin.value);
  const canInviteAdmins = computed(() => isSuperAdmin.value);

  // Periksa izin per halaman untuk Editor (Super Admin & Admin selalu punya akses penuh)
  function hasPagePermission(pageKey: string): boolean {
    if (!user.value) return false;
    if (isSuperAdmin.value || isAdmin.value) return true;
    if (pageKey === 'dashboard') return true;
    const userPerms = user.value.permissions || [];
    return userPerms.includes(pageKey);
  }

  async function checkSession(): Promise<boolean> {
    isLoading.value = true;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        user.value = data.data?.user || data.user || null;
        if (user.value) {
          localStorage.setItem('talitakumi_admin_auth', 'true');
          isInitialized.value = true;
          return true;
        }
      }

      // Sesi tidak valid di backend: bersihkan state lokal
      user.value = null;
      localStorage.removeItem('talitakumi_admin_auth');
      isInitialized.value = true;
      return false;
    } catch {
      user.value = null;
      localStorage.removeItem('talitakumi_admin_auth');
      isInitialized.value = true;
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function login(email: string, password: string): Promise<{ success: boolean; message?: string }> {
    isLoading.value = true;
    const cleanEmail = email.trim();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && (data.success || data.user || data.data?.user)) {
        user.value = data.data?.user || data.user;
        localStorage.setItem('talitakumi_admin_auth', 'true');
        return { success: true };
      }

      return {
        success: false,
        message: data.message || data.error || 'Email atau kata sandi tidak sesuai.',
      };
    } catch {
      return {
        success: false,
        message: 'Gagal menghubungi server. Periksa koneksi internet Anda.',
      };
    } finally {
      isLoading.value = false;
    }
  }

  async function logout() {
    isLoading.value = true;
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      user.value = null;
      localStorage.removeItem('talitakumi_admin_auth');
      isLoading.value = false;
      router.push('/admin/login');
    }
  }

  return {
    user,
    isLoading,
    isInitialized,
    isAuthenticated,
    isSuperAdmin,
    isAdmin,
    isEditor,
    canManageSettings,
    canManageUsers,
    canAccessWizard,
    canInviteAdmins,
    hasPagePermission,
    checkSession,
    login,
    logout,
  };
});
