<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useContentStore } from '@/stores/content';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notifications';
import {
  Shield,
  UserPlus,
  Save,
  Check,
  RefreshCw,
  Copy,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Key,
  Laptop,
  Smartphone,
  Globe,
  Trash2,
  Lock,
  UserCheck,
  UserX,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  AlertCircle,
  Sliders,
  CheckSquare,
  Square,
  Images,
  Users as UsersIcon,
  CalendarCheck,
  FileText,
  Edit3,
  Mail,
  Send,
  CheckCircle2,
  Wifi,
  WifiOff,
  Unlink,
  Link as LinkIcon,
} from 'lucide-vue-next';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR';
  permissions: string[];
  status: 'PENDING_ACTIVATION' | 'INVITED' | 'ACTIVE' | 'DISABLED';
  statusReason?: string | null;
  activeSessions: number;
  hasActiveInvitation: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserSession {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceLabel: string;
  isCurrent: boolean;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
}

interface SecurityStats {
  activeUsers: number;
  pendingUsers: number;
  disabledUsers: number;
  activeSessions: number;
  failedLogins24h: number;
  recentSecurityEvents: Array<{
    id: string;
    eventType: string;
    userId: string | null;
    userEmail: string | null;
    ipAddress: string | null;
    metadata: any;
    createdAt: string;
  }>;
}

const AVAILABLE_PAGE_PERMISSIONS = [
  { key: 'gallery', label: 'Galeri & Album', path: '/admin/galeri', icon: Images },
  { key: 'officers', label: 'Susunan Pengurus', path: '/admin/pengurus', icon: UsersIcon },
  { key: 'programs', label: 'Program Kerja', path: '/admin/program', icon: CalendarCheck },
  { key: 'pages', label: 'Teks Halaman', path: '/admin/halaman', icon: FileText },
];

const contentStore = useContentStore();
const authStore = useAuthStore();
const settings = contentStore.settings;

const activeTab = ref<'identity' | 'users' | 'security'>('identity');
const isSaved = ref(false);

// Tab 1 state
const orgName = ref(settings.organizationName);
const branchName = ref(settings.branchName);
const subBranchName = ref(settings.subBranchName);

function saveIdentity() {
  contentStore.saveSettings({
    organizationName: orgName.value.trim(),
    branchName: branchName.value.trim(),
    subBranchName: subBranchName.value.trim(),
  });

  isSaved.value = true;
  notificationStore.success('Berhasil Disimpan', 'Identitas lembaga telah diperbarui.');
  setTimeout(() => {
    isSaved.value = false;
  }, 2500);
}

// Tab 2 & 3 state
const usersList = ref<AdminUser[]>([]);
const mySessions = ref<UserSession[]>([]);
const securityStats = ref<SecurityStats | null>(null);
const isLoadingData = ref(false);
const actionError = ref('');
const actionSuccess = ref('');

const notificationStore = useNotificationStore();

watch(actionSuccess, (newVal) => {
  if (newVal) {
    notificationStore.success('Berhasil', newVal);
  }
});

watch(actionError, (newVal) => {
  if (newVal) {
    notificationStore.error('Perhatian', newVal);
  }
});

// Modals
const isInviteModalOpen = ref(false);
const inviteName = ref('');
const inviteEmail = ref('');
const inviteRole = ref<'ADMIN' | 'EDITOR'>('EDITOR');
const invitePermissions = ref<string[]>(['gallery', 'officers', 'programs', 'pages']);
const isInviting = ref(false);
const newlyCreatedInviteUrl = ref('');
const hasCopiedInvite = ref(false);

const isDisableModalOpen = ref(false);
const userToDisable = ref<AdminUser | null>(null);
const disableReason = ref('');
const isDisabling = ref(false);

// Edit User Profile & Permissions Modal (Superadmin untuk Admin & Editor; Admin untuk Editor)
const isEditUserModalOpen = ref(false);
const userToEdit = ref<AdminUser | null>(null);
const editUserName = ref('');
const editUserEmail = ref('');
const editUserRole = ref<'ADMIN' | 'EDITOR'>('EDITOR');
const editUserPassword = ref('');
const editUserPermissions = ref<string[]>([]);
const isSavingUser = ref(false);
const editUserInviteUrl = ref('');
const isLoadingInviteUrl = ref(false);
const hasCopiedEditInvite = ref(false);

function selectAllEditPermissions() {
  editUserPermissions.value = AVAILABLE_PAGE_PERMISSIONS.map((p) => p.key);
}

function clearAllEditPermissions() {
  editUserPermissions.value = [];
}

async function fetchOrCreateInviteUrl(userId: string) {
  isLoadingInviteUrl.value = true;
  try {
    const res = await fetch(`/api/admin/users?action=invite_url&userId=${encodeURIComponent(userId)}`);
    const data = await res.json();
    if (res.ok && data.data?.activationUrl) {
      editUserInviteUrl.value = data.data.activationUrl;
    } else {
      editUserInviteUrl.value = '';
    }
  } catch {
    editUserInviteUrl.value = '';
  } finally {
    isLoadingInviteUrl.value = false;
  }
}

function copyEditInviteUrl() {
  if (!editUserInviteUrl.value) return;
  navigator.clipboard.writeText(editUserInviteUrl.value);
  hasCopiedEditInvite.value = true;
  notificationStore.success('Tersalin', 'Tautan undangan berhasil disalin ke papan klip.');
  setTimeout(() => {
    hasCopiedEditInvite.value = false;
  }, 3000);
}

function openEditUserModal(user: AdminUser) {
  userToEdit.value = user;
  editUserName.value = user.name;
  editUserEmail.value = user.email;
  editUserRole.value = user.role === 'ADMIN' ? 'ADMIN' : 'EDITOR';
  editUserPassword.value = '';
  editUserPermissions.value = [...(user.permissions || [])];
  editUserInviteUrl.value = '';
  hasCopiedEditInvite.value = false;
  isEditUserModalOpen.value = true;

  // Jika akun dinonaktifkan atau belum aktif, otomatis muat URL undangannya
  if (user.status !== 'ACTIVE') {
    fetchOrCreateInviteUrl(user.id);
  }
}

function toggleEditPermission(permKey: string) {
  if (editUserPermissions.value.includes(permKey)) {
    editUserPermissions.value = editUserPermissions.value.filter((k) => k !== permKey);
  } else {
    editUserPermissions.value.push(permKey);
  }
}

async function handleSaveEditedUser() {
  if (!userToEdit.value) return;
  if (!editUserName.value.trim()) {
    notificationStore.warning('Validasi Gagal', 'Nama pengurus wajib diisi');
    return;
  }
  if (editUserPassword.value && editUserPassword.value.trim().length < 8) {
    notificationStore.warning('Validasi Gagal', 'Kata sandi baru minimal harus 8 karakter');
    return;
  }

  isSavingUser.value = true;
  try {
    const payload: Record<string, any> = {
      id: userToEdit.value.id,
      name: editUserName.value.trim(),
    };

    if (authStore.isSuperAdmin) {
      payload.email = editUserEmail.value.trim();
      payload.role = editUserRole.value;
    }

    if (editUserPassword.value.trim()) {
      payload.password = editUserPassword.value.trim();
    }

    if (editUserRole.value === 'EDITOR') {
      payload.permissions = editUserPermissions.value;
    }

    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      notificationStore.error('Gagal', data.message || data.error || 'Gagal menyimpan perubahan profil');
      return;
    }

    isEditUserModalOpen.value = false;
    actionSuccess.value = `Profil ${editUserName.value} berhasil diperbarui.`;
    setTimeout(() => (actionSuccess.value = ''), 4000);
    await loadAdminData();
  } catch (err: any) {
    notificationStore.error('Kesalahan', 'Terjadi kesalahan: ' + err.message);
  } finally {
    isSavingUser.value = false;
  }
}

// Editors list for Matrix Tab
const editorsList = computed(() => {
  return usersList.value.filter((u) => u.role === 'EDITOR');
});

// Load data
async function loadAdminData() {
  isLoadingData.value = true;
  actionError.value = '';

  try {
    // 1. Load users list (Super Admin otomatis disaring backend)
    const resUsers = await fetch('/api/admin/users');
    if (resUsers.ok) {
      const data = await resUsers.json();
      const rawUsers = data.data?.users || data.users || [];
      usersList.value = rawUsers.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        permissions: Array.isArray(u.permissions) ? u.permissions : [],
        status: u.status,
        statusReason: u.disabledReason,
        activeSessions: u.activeSessionsCount ?? u._count?.sessions ?? 0,
        hasActiveInvitation: !!u.hasActiveInvitation,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt || u.createdAt,
      }));
    }

    // 2. Load security stats
    const resStats = await fetch('/api/admin/security/stats');
    if (resStats.ok) {
      const data = await resStats.json();
      const metrics = data.data?.metrics || data.metrics || {};
      const recentEvents = data.data?.recentEvents || data.recentEvents || [];
      securityStats.value = {
        activeUsers: metrics.activeUsersCount ?? 0,
        pendingUsers: metrics.pendingUsersCount ?? 0,
        disabledUsers: metrics.disabledUsersCount ?? 0,
        activeSessions: metrics.activeSessionsCount ?? 0,
        failedLogins24h: metrics.failedLogins24h ?? 0,
        recentSecurityEvents: recentEvents.map((evt: any) => ({
          id: evt.id,
          eventType: evt.eventType,
          userId: evt.actorEmail || null,
          userEmail: evt.actorEmail || null,
          ipAddress: evt.ipAddress || null,
          metadata: evt.details ? { detail: evt.details } : null,
          createdAt: evt.createdAt,
        })),
      };
    }

    // 3. Load my sessions
    const resSessions = await fetch('/api/me/sessions');
    if (resSessions.ok) {
      const data = await resSessions.json();
      const list = Array.isArray(data.data) ? data.data : (data.sessions || []);
      mySessions.value = list.map((s: any, idx: number) => ({
        id: s.id,
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        deviceLabel: s.userAgent ? (s.userAgent.includes('Mobile') ? 'Smartphone' : 'Komputer Desktop / Browser') : 'Browser Web',
        isCurrent: idx === 0,
        createdAt: s.createdAt,
        lastActiveAt: s.lastActiveAt,
        expiresAt: s.expiresAt,
      }));
    }
  } catch (err: any) {
    actionError.value = 'Sebagian data gagal dimuat dari server: ' + (err.message || 'Error');
  } finally {
    isLoadingData.value = false;
  }
}

onMounted(() => {
  loadAdminData();
});

// User actions
async function handleInviteUser() {
  if (!inviteName.value || !inviteEmail.value) {
    actionError.value = 'Silakan lengkapi nama dan email calon pengurus.';
    return;
  }

  isInviting.value = true;
  actionError.value = '';
  try {
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: inviteName.value.trim(),
        email: inviteEmail.value.trim(),
        role: inviteRole.value,
        permissions: inviteRole.value === 'EDITOR' ? invitePermissions.value : [],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      actionError.value = data.message || data.error || 'Gagal membuat undangan.';
      return;
    }

    newlyCreatedInviteUrl.value = data.data?.activationUrl || data.activationUrl;
    inviteName.value = '';
    inviteEmail.value = '';
    invitePermissions.value = ['gallery', 'officers', 'programs', 'pages'];
    await loadAdminData();
  } catch (err: any) {
    actionError.value = 'Gagal memproses undangan: ' + err.message;
  } finally {
    isInviting.value = false;
  }
}

function copyInviteUrl() {
  if (!newlyCreatedInviteUrl.value) return;
  navigator.clipboard.writeText(newlyCreatedInviteUrl.value);
  hasCopiedInvite.value = true;
  setTimeout(() => {
    hasCopiedInvite.value = false;
  }, 3000);
}

function setRoleToEditor() {
  editUserRole.value = 'EDITOR';
  if (editUserPermissions.value.length === 0) {
    editUserPermissions.value = ['gallery', 'officers', 'programs', 'pages'];
  }
}

// Hapus Pengguna (Super Admin bisa hapus Admin & Editor; Admin hanya bisa hapus Editor)
async function handleDeleteUser(user: AdminUser) {
  if (user.id === authStore.user?.id) {
    notificationStore.warning('Aksi Ditolak', 'Anda tidak dapat menghapus akun Anda sendiri.');
    return;
  }

  if (authStore.isAdmin && user.role === 'ADMIN') {
    notificationStore.warning('Aksi Ditolak', 'Hanya Super Admin yang berwenang menghapus akun Admin.');
    return;
  }

  const confirmMsg = `Hapus pengguna "${user.name}" (${user.email}) secara permanen?\n\nPerhatian: Seluruh data sesi dan akses akun ini akan dihapus dari database. Tindakan ini tidak dapat dibatalkan.`;
  if (!confirm(confirmMsg)) return;

  try {
    const res = await fetch(`/api/admin/users?id=${encodeURIComponent(user.id)}&action=delete_user`, {
      method: 'DELETE',
    });

    const data = await res.json();
    if (!res.ok) {
      notificationStore.error('Gagal Menghapus', data.message || data.error || 'Gagal menghapus pengguna.');
      return;
    }

    actionSuccess.value = `Akun ${user.name} berhasil dihapus secara permanen.`;
    notificationStore.success('Pengguna Dihapus', actionSuccess.value);
    await loadAdminData();
  } catch (err: any) {
    notificationStore.error('Kesalahan', 'Terjadi kesalahan saat menghapus pengguna: ' + err.message);
  }
}

function openDisableModal(user: AdminUser) {
  userToDisable.value = user;
  disableReason.value = '';
  isDisableModalOpen.value = true;
}

async function confirmDisableUser() {
  if (!userToDisable.value) return;

  isDisabling.value = true;
  actionError.value = '';
  try {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: userToDisable.value.id,
        status: 'DISABLED',
        disabledReason: disableReason.value.trim() || 'Dinonaktifkan oleh administrator',
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      notificationStore.error('Gagal', data.message || data.error || 'Gagal menonaktifkan pengguna.');
      return;
    }

    isDisableModalOpen.value = false;
    userToDisable.value = null;
    actionSuccess.value = 'Akun pengguna berhasil dinonaktifkan dan seluruh sesi aktif telah dicabut.';
    setTimeout(() => (actionSuccess.value = ''), 4000);
    await loadAdminData();
  } catch (err: any) {
    notificationStore.error('Kesalahan', 'Terjadi kesalahan: ' + err.message);
  } finally {
    isDisabling.value = false;
  }
}

async function handleEnableUser(user: AdminUser) {
  if (!confirm(`Aktifkan kembali akun ${user.name}? Pengguna ini akan dapat masuk kembali dengan kredensialnya.`)) {
    return;
  }

  actionError.value = '';
  try {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id, status: 'ACTIVE' }),
    });

    const data = await res.json();
    if (!res.ok) {
      notificationStore.error('Gagal', data.message || data.error || 'Gagal mengaktifkan pengguna.');
      return;
    }

    actionSuccess.value = `Akun ${user.name} telah diaktifkan kembali.`;
    setTimeout(() => (actionSuccess.value = ''), 4000);
    await loadAdminData();
  } catch (err: any) {
    notificationStore.error('Kesalahan', 'Terjadi kesalahan: ' + err.message);
  }
}

async function handleRevokeUserSessions(user: AdminUser) {
  if (!confirm(`Cabut seluruh sesi aktif untuk ${user.name}? Pengguna ini akan dipaksa logout dari semua perangkat.`)) {
    return;
  }

  actionError.value = '';
  try {
    const res = await fetch(`/api/admin/users?userId=${encodeURIComponent(user.id)}&action=revoke_sessions`, {
      method: 'DELETE',
    });

    const data = await res.json();
    if (!res.ok) {
      notificationStore.error('Gagal', data.message || data.error || 'Gagal mencabut sesi.');
      return;
    }

    actionSuccess.value = `Seluruh sesi untuk ${user.name} berhasil dicabut.`;
    setTimeout(() => (actionSuccess.value = ''), 4000);
    await loadAdminData();
  } catch (err: any) {
    notificationStore.error('Kesalahan', 'Terjadi kesalahan: ' + err.message);
  }
}

async function handleResendInvite(user: AdminUser) {
  isInviting.value = true;
  actionError.value = '';
  try {
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions || [],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      notificationStore.error('Gagal', data.message || data.error || 'Gagal memperbarui undangan.');
      return;
    }

    newlyCreatedInviteUrl.value = data.data?.activationUrl || data.activationUrl;
    isInviteModalOpen.value = true;
    await loadAdminData();
  } catch (err: any) {
    notificationStore.error('Kesalahan', 'Terjadi kesalahan: ' + err.message);
  } finally {
    isInviting.value = false;
  }
}

// Session actions
async function handleRevokeMySession(sessionId: string, isCurrent: boolean) {
  const confirmMsg = isCurrent
    ? 'Cabut sesi ini? Anda akan langsung keluar dan diarahkan ke halaman login.'
    : 'Cabut sesi login perangkat ini?';

  if (!confirm(confirmMsg)) return;

  try {
    const res = await fetch(`/api/me/sessions?sessionId=${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      if (isCurrent) {
        authStore.logout();
      } else {
        await loadAdminData();
      }
    } else {
      const data = await res.json();
      notificationStore.error('Gagal', data.message || data.error || 'Gagal mencabut sesi.');
    }
  } catch (err: any) {
    notificationStore.error('Kesalahan', 'Terjadi kesalahan: ' + err.message);
  }
}

async function handleRevokeOtherSessions() {
  if (!confirm('Cabut semua sesi perangkat lain? Hanya sesi browser ini yang akan tetap aktif.')) {
    return;
  }

  try {
    const res = await fetch('/api/me/sessions?revokeOthers=true', {
      method: 'DELETE',
    });

    if (res.ok) {
      actionSuccess.value = 'Semua sesi lain berhasil dicabut.';
      setTimeout(() => (actionSuccess.value = ''), 4000);
      await loadAdminData();
    } else {
      const data = await res.json();
      notificationStore.error('Gagal', data.message || data.error || 'Gagal mencabut sesi lain.');
    }
  } catch (err: any) {
    notificationStore.error('Kesalahan', 'Terjadi kesalahan: ' + err.message);
  }
}

function formatDate(isoString: string): string {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return isoString;
  }
}

function getPermissionLabel(key: string): string {
  const match = AVAILABLE_PAGE_PERMISSIONS.find((p) => p.key === key);
  return match ? match.label : key;
}
</script>

<template>
  <div class="settings-admin">
    <div class="admin-page-header">
      <div>
        <h1 class="page-title">Pengaturan Sistem & Hak Akses</h1>
        <p class="page-desc">Kelola identitas organisasi, akun pengurus, matriks izin editor per pengguna, dan audit keamanan.</p>
      </div>

      <button
        type="button"
        class="btn btn-secondary reload-btn"
        @click="loadAdminData"
        :disabled="isLoadingData"
        title="Muat ulang data terbaru dari Neon"
      >
        <RefreshCw :size="16" :class="{ 'spin-anim': isLoadingData }" />
        <span>Segarkan</span>
      </button>
    </div>

    <!-- GLOBAL BANNERS -->
    <div v-if="actionSuccess" class="alert-box success-alert" role="alert">
      <CheckCircle :size="18" />
      <span>{{ actionSuccess }}</span>
    </div>

    <div v-if="actionError" class="alert-box error-alert" role="alert">
      <AlertCircle :size="18" />
      <span>{{ actionError }}</span>
    </div>

    <!-- TABS NAVIGATION -->
    <div class="tabs-nav card">
      <button
        type="button"
        class="tab-btn"
        :class="{ 'is-active': activeTab === 'identity' }"
        @click="activeTab = 'identity'"
      >
        <span>Identitas Lembaga</span>
      </button>
      <button
        type="button"
        class="tab-btn"
        :class="{ 'is-active': activeTab === 'users' }"
        @click="activeTab = 'users'"
      >
        <span>Pengguna & Hak Akses</span>
        <span v-if="usersList.length" class="tab-badge">{{ usersList.length }}</span>
      </button>
      <button
        type="button"
        class="tab-btn"
        :class="{ 'is-active': activeTab === 'security' }"
        @click="activeTab = 'security'"
      >
        <span>Audit & Dasbor Keamanan</span>
      </button>
    </div>

    <!-- TAB 1: IDENTITAS -->
    <section v-if="activeTab === 'identity'" class="tab-pane card">
      <div class="pane-head">
        <div>
          <h2 class="pane-title">Identitas Organisasi Gereja</h2>
          <p class="pane-desc">Nama resmi lembaga yang ditampilkan pada header dan footer situs publik.</p>
        </div>
        <button type="button" class="btn btn-primary" @click="saveIdentity">
          <Check v-if="isSaved" :size="18" />
          <Save v-else :size="18" />
          <span>{{ isSaved ? 'Tersimpan!' : 'Simpan Identitas' }}</span>
        </button>
      </div>

      <div class="form-grid">
        <div class="form-group full-width">
          <label class="form-label">Nama Induk Organisasi</label>
          <input v-model="orgName" type="text" class="form-input" />
        </div>

        <div class="form-group">
          <label class="form-label">Nama Cabang / Daerah</label>
          <input v-model="branchName" type="text" class="form-input" />
        </div>

        <div class="form-group">
          <label class="form-label">Nama Ranting</label>
          <input v-model="subBranchName" type="text" class="form-input" />
        </div>
      </div>
    </section>

    <!-- TAB 2: PENGGUNA & HAK AKSES -->
    <section v-if="activeTab === 'users'" class="tab-pane card">
      <div class="pane-head">
        <div>
          <h2 class="pane-title">Akun Pengurus & Hak Akses</h2>
          <p class="pane-desc">
            Sistem tertutup (invite-only). Super Admin disembunyikan dari tabel untuk keamanan sistem. Admin memiliki akses penuh, sedangkan Editor memiliki izin per halaman yang dapat disesuaikan.
          </p>
        </div>
        <button
          type="button"
          class="btn btn-primary"
          @click="isInviteModalOpen = true"
        >
          <UserPlus :size="18" />
          <span>Undang Pengguna Baru</span>
        </button>
      </div>

      <!-- INVITATION URL BOX (IF GENERATED) -->
      <div v-if="newlyCreatedInviteUrl" class="invite-success-banner card">
        <div class="invite-badge">
          <Key :size="20" />
        </div>
        <div class="invite-content">
          <h4 class="invite-title">Tautan Aktivasi Pengurus Berhasil Dibuat</h4>
          <p class="invite-desc">
            Berikan tautan ini kepada calon pengurus. Tautan hanya dapat digunakan 1 kali dan kedaluwarsa dalam 24 jam.
          </p>
          <div class="invite-input-row">
            <input type="text" readonly :value="newlyCreatedInviteUrl" class="form-input invite-url-field" />
            <button type="button" class="btn btn-secondary" @click="copyInviteUrl">
              <CheckCircle v-if="hasCopiedInvite" :size="16" class="text-success" />
              <Copy v-else :size="16" />
              <span>{{ hasCopiedInvite ? 'Tersalin!' : 'Salin Tautan' }}</span>
            </button>
            <button type="button" class="btn btn-ghost" @click="newlyCreatedInviteUrl = ''" title="Tutup">
              ✕
            </button>
          </div>
        </div>
      </div>

      <!-- USERS TABLE -->
      <div class="users-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Pengurus</th>
              <th>Email</th>
              <th>Peran</th>
              <th>Izin Halaman</th>
              <th>Status</th>
              <th>Sesi Aktif</th>
              <th class="text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="usersList.length === 0">
              <td colspan="7" class="empty-cell">
                <div v-if="isLoadingData" class="empty-state">
                  <RefreshCw :size="24" class="spin-anim" />
                  <span>Memuat data pengguna dari database Neon...</span>
                </div>
                <div v-else class="empty-state">
                  <span>Tidak ada data pengguna Admin/Editor. (Akun Super Admin disembunyikan).</span>
                </div>
              </td>
            </tr>

            <tr v-for="user in usersList" :key="user.id">
              <td>
                <div class="user-meta-cell">
                  <div class="user-avatar-badge">
                    {{ user.name.slice(0, 2).toUpperCase() }}
                  </div>
                  <div>
                    <div class="user-name-strong">{{ user.name }}</div>
                    <div v-if="user.id === authStore.user?.id" class="current-user-tag">Akun Anda</div>
                  </div>
                </div>
              </td>
              <td>{{ user.email }}</td>
              <td>
                <span class="role-badge" :class="user.role === 'ADMIN' ? 'admin' : 'editor'">
                  {{ user.role === 'ADMIN' ? 'Admin' : 'Editor' }}
                </span>
              </td>
              <td>
                <!-- JIKA ADMIN: AKSES PENUH -->
                <span v-if="user.role === 'ADMIN'" class="perm-full-tag">
                  Semua Halaman (Akses Penuh)
                </span>
                <!-- JIKA EDITOR: TAMPILKAN PIL PERIZINAN -->
                <div v-else class="perm-tags-list">
                  <span
                    v-for="pKey in user.permissions"
                    :key="pKey"
                    class="perm-tag"
                  >
                    {{ getPermissionLabel(pKey) }}
                  </span>
                  <span v-if="!user.permissions || user.permissions.length === 0" class="perm-tag none">
                    Belum ada izin halaman
                  </span>
                </div>
              </td>
              <td>
                <span v-if="user.status === 'ACTIVE'" class="status-badge active">
                  <span class="status-dot green"></span> Aktif
                </span>
                <span v-else-if="user.status === 'PENDING_ACTIVATION' || user.status === 'INVITED'" class="status-badge pending">
                  <span class="status-dot yellow"></span> Menunggu Aktivasi
                </span>
                <span v-else class="status-badge disabled" :title="user.statusReason || 'Akun dinonaktifkan'">
                  <span class="status-dot red"></span> Dinonaktifkan
                </span>
              </td>
              <td>
                <span class="sessions-count" :class="{ 'has-sessions': user.activeSessions > 0 }">
                  {{ user.activeSessions }} sesi
                </span>
              </td>
              <td class="text-right">
                <div class="table-actions">
                  <!-- Edit Profil & Izin: Super Admin bisa edit Admin & Editor; Admin bisa edit Editor (termasuk kata sandinya & izin halaman) -->
                  <button
                    v-if="authStore.isSuperAdmin || (authStore.isAdmin && user.role === 'EDITOR')"
                    type="button"
                    class="action-btn"
                    @click="openEditUserModal(user)"
                    :title="`Edit data, peran, sandi & izin ${user.name}`"
                  >
                    <Edit3 :size="15" />
                    <span>Edit</span>
                  </button>

                  <!-- Revoke sessions -->
                  <button
                    v-if="user.activeSessions > 0"
                    type="button"
                    class="action-btn warning"
                    @click="handleRevokeUserSessions(user)"
                    title="Cabut semua sesi pengguna ini"
                  >
                    <Lock :size="15" />
                    <span>Cabut Sesi</span>
                  </button>

                  <!-- Resend invite if pending -->
                  <button
                    v-if="user.status === 'PENDING_ACTIVATION'"
                    type="button"
                    class="action-btn"
                    @click="handleResendInvite(user)"
                    title="Buat ulang tautan aktivasi"
                  >
                    <Key :size="15" />
                    <span>Tautan Baru</span>
                  </button>

                  <!-- Disable / Enable -->
                  <button
                    v-if="user.status === 'ACTIVE'"
                    type="button"
                    class="action-btn danger"
                    @click="openDisableModal(user)"
                    title="Nonaktifkan akun"
                    :disabled="user.id === authStore.user?.id"
                  >
                    <UserX :size="15" />
                    <span>Nonaktifkan</span>
                  </button>
                  <button
                    v-else-if="user.status === 'DISABLED'"
                    type="button"
                    class="action-btn success"
                    @click="handleEnableUser(user)"
                    title="Aktifkan kembali akun"
                  >
                    <UserCheck :size="15" />
                    <span>Aktifkan</span>
                  </button>

                  <!-- Hapus Pengguna Permanen -->
                  <button
                    v-if="(authStore.isSuperAdmin && user.id !== authStore.user?.id) || (authStore.isAdmin && user.role === 'EDITOR')"
                    type="button"
                    class="action-btn danger delete-btn"
                    @click="handleDeleteUser(user)"
                    :title="`Hapus pengguna ${user.name} secara permanen`"
                  >
                    <Trash2 :size="15" />
                    <span>Hapus</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- TAB 3: AUDIT & DASBOR KEAMANAN -->
    <section v-if="activeTab === 'security'" class="tab-pane card">
      <div class="pane-head">
        <div>
          <h2 class="pane-title">Dasbor Keamanan & Audit Log</h2>
          <p class="pane-desc">
            Pemantauan sesi aktif, integritas autentikasi, rate limit, dan jejak aktivitas penting pengurus.
          </p>
        </div>
      </div>

      <!-- SECURITY STATS METRICS -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Pengguna Aktif</div>
          <div class="metric-value text-success">{{ securityStats?.activeUsers ?? '-' }}</div>
          <div class="metric-desc">Akun berstatus aktif di sistem</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Menunggu Aktivasi</div>
          <div class="metric-value text-warning">{{ securityStats?.pendingUsers ?? '-' }}</div>
          <div class="metric-desc">Undangan belum diaktivasi</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Akun Dinonaktifkan</div>
          <div class="metric-value text-danger">{{ securityStats?.disabledUsers ?? '-' }}</div>
          <div class="metric-desc">Akses ditutup oleh admin</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Total Sesi Aktif</div>
          <div class="metric-value text-primary">{{ securityStats?.activeSessions ?? '-' }}</div>
          <div class="metric-desc">Sesi database Neon yang valid</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Percobaan Gagal (24 Jam)</div>
          <div class="metric-value" :class="(securityStats?.failedLogins24h ?? 0) > 5 ? 'text-danger' : 'text-muted'">
            {{ securityStats?.failedLogins24h ?? 0 }}
          </div>
          <div class="metric-desc">Dipantau oleh rate limiter</div>
        </div>
      </div>

      <!-- MY SESSIONS SECTION -->
      <div class="sub-section">
        <div class="sub-section-head">
          <div>
            <h3 class="sub-title">Sesi Login Akun Anda</h3>
            <p class="sub-desc">Daftar perangkat yang saat ini terautentikasi dengan akun Anda.</p>
          </div>
          <button
            v-if="mySessions.length > 1"
            type="button"
            class="btn btn-secondary btn-sm"
            @click="handleRevokeOtherSessions"
          >
            <Lock :size="15" />
            <span>Cabut Semua Sesi Lain</span>
          </button>
        </div>

        <div class="sessions-list">
          <div
            v-for="session in mySessions"
            :key="session.id"
            class="session-card"
            :class="{ 'is-current': session.isCurrent }"
          >
            <div class="session-icon">
              <Laptop v-if="session.deviceLabel.toLowerCase().includes('desktop') || session.deviceLabel.toLowerCase().includes('windows') || session.deviceLabel.toLowerCase().includes('mac')" :size="20" />
              <Smartphone v-else :size="20" />
            </div>
            <div class="session-info">
              <div class="session-device-line">
                <strong>{{ session.deviceLabel }}</strong>
                <span v-if="session.isCurrent" class="current-session-badge">Sesi Ini</span>
              </div>
              <div class="session-meta">
                <span>IP: {{ session.ipAddress || 'Internal' }}</span>
                <span>•</span>
                <span>Terakhir aktif: {{ formatDate(session.lastActiveAt) }}</span>
                <span>•</span>
                <span>Dibuat: {{ formatDate(session.createdAt) }}</span>
              </div>
            </div>
            <div class="session-action">
              <button
                type="button"
                class="btn btn-ghost btn-sm danger-text"
                @click="handleRevokeMySession(session.id, session.isCurrent)"
                :title="session.isCurrent ? 'Keluar dari sesi ini' : 'Cabut sesi ini'"
              >
                {{ session.isCurrent ? 'Keluar' : 'Cabut Sesi' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- RECENT SECURITY AUDIT EVENTS -->
      <div class="sub-section">
        <div class="sub-section-head">
          <div>
            <h3 class="sub-title">Peristiwa Keamanan Terbaru (Audit Log)</h3>
            <p class="sub-desc">Rekam jejak login, perubahan peran, aktivasi, dan tindakan berisiko tinggi.</p>
          </div>
        </div>

        <div class="logs-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Peristiwa</th>
                <th>Subjek</th>
                <th>IP Address</th>
                <th>Waktu</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!securityStats?.recentSecurityEvents?.length">
                <td colspan="5" class="empty-cell">
                  <div class="empty-state">
                    <span>Belum ada peristiwa keamanan tercatat.</span>
                  </div>
                </td>
              </tr>
              <tr v-for="evt in securityStats?.recentSecurityEvents" :key="evt.id">
                <td>
                  <span
                    class="event-badge"
                    :class="{
                      'badge-red': evt.eventType.includes('FAILED') || evt.eventType.includes('DISABLED') || evt.eventType.includes('LOCKED'),
                      'badge-green': evt.eventType.includes('SUCCESS') || evt.eventType.includes('ENABLED') || evt.eventType.includes('ACTIVATED'),
                      'badge-blue': evt.eventType.includes('INVITED') || evt.eventType.includes('CHANGED') || evt.eventType.includes('REVOKED')
                    }"
                  >
                    {{ evt.eventType }}
                  </span>
                </td>
                <td>{{ evt.userEmail || evt.userId || '-' }}</td>
                <td><code>{{ evt.ipAddress || '-' }}</code></td>
                <td class="text-muted">{{ formatDate(evt.createdAt) }}</td>
                <td class="event-meta-cell">
                  <span v-if="evt.metadata">{{ JSON.stringify(evt.metadata) }}</span>
                  <span v-else class="text-muted">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- MODAL UNDANG PENGGUNA -->
    <div v-if="isInviteModalOpen" class="modal-backdrop" @click="isInviteModalOpen = false">
      <div class="modal-dialog card" @click.stop>
        <div class="modal-head">
          <h3 class="modal-title">Undang Pengurus Baru</h3>
          <button type="button" class="close-btn" @click="isInviteModalOpen = false">✕</button>
        </div>

        <form @submit.prevent="handleInviteUser" class="modal-body">
          <p class="modal-desc">
            Undangan akan membuat akun dalam status <em>Menunggu Aktivasi</em>. Tautan aktivasi satu kali pakai akan
            dihasilkan untuk dikirimkan kepada calon pengurus (masa berlaku 24 jam).
          </p>

          <div class="form-group">
            <label class="form-label">Nama Lengkap Pengurus</label>
            <input
              v-model="inviteName"
              type="text"
              required
              class="form-input"
              placeholder="Contoh: Yohana Manuhutu"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Alamat Email Resmi</label>
            <input
              v-model="inviteEmail"
              type="email"
              required
              class="form-input"
              placeholder="nama@talitakumi.org"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Peran Pengurus</label>
            <select v-model="inviteRole" class="form-input">
              <option value="EDITOR">Editor (Izin Halaman Spesifik Per User)</option>
              <option v-if="authStore.isSuperAdmin" value="ADMIN">
                Admin (Akses Penuh: Seluruh Halaman & Pengaturan)
              </option>
            </select>
          </div>

          <!-- CHECKBOX PERIZINAN JIKA EDITOR -->
          <div v-if="inviteRole === 'EDITOR'" class="form-group perms-section">
            <label class="form-label">Izin Halaman Akses untuk Editor Ini:</label>
            <div class="perms-checkboxes-grid">
              <label
                v-for="page in AVAILABLE_PAGE_PERMISSIONS"
                :key="page.key"
                class="perm-checkbox-item"
              >
                <input
                  type="checkbox"
                  v-model="invitePermissions"
                  :value="page.key"
                />
                <component :is="page.icon" :size="15" />
                <span>{{ page.label }}</span>
              </label>
            </div>
            <p class="field-hint">
              Anda dapat mencentang sebagian atau semua halaman. Izin dapat diubah kapan saja di kemudian hari.
            </p>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="isInviteModalOpen = false">
              Batal
            </button>
            <button type="submit" class="btn btn-primary" :disabled="isInviting">
              <UserPlus :size="16" />
              <span>{{ isInviting ? 'Memproses...' : 'Buat Tautan Undangan' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL NONAKTIFKAN AKUN -->
    <div v-if="isDisableModalOpen" class="modal-backdrop" @click="isDisableModalOpen = false">
      <div class="modal-dialog card" @click.stop>
        <div class="modal-head">
          <h3 class="modal-title danger-text">Nonaktifkan Akun Pengurus</h3>
          <button type="button" class="close-btn" @click="isDisableModalOpen = false">✕</button>
        </div>

        <form @submit.prevent="confirmDisableUser" class="modal-body">
          <p class="modal-desc">
            Anda akan menonaktifkan akun <strong>{{ userToDisable?.name }}</strong> ({{ userToDisable?.email }}).
            Seluruh sesi login aktif akan segera dicabut dan pengguna tidak akan dapat mengakses panel admin sampai
            diaktifkan kembali.
          </p>

          <div class="form-group">
            <label class="form-label">Alasan Penonaktifan</label>
            <textarea
              v-model="disableReason"
              rows="3"
              required
              class="form-input"
              placeholder="Contoh: Selesai masa jabatan periode kepengurusan / Perangkat hilang"
            ></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="isDisableModalOpen = false">
              Batal
            </button>
            <button type="submit" class="btn btn-danger" :disabled="isDisabling">
              <UserX :size="16" />
              <span>{{ isDisabling ? 'Memproses...' : 'Konfirmasi Nonaktifkan' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
    <!-- MODAL EDIT PROFIL & KATA SANDI PENGGUNA -->
    <div v-if="isEditUserModalOpen" class="modal-backdrop" @click="isEditUserModalOpen = false">
      <div class="modal-dialog card" @click.stop>
        <div class="modal-head">
          <h3 class="modal-title">Edit Profil & Kata Sandi Pengurus</h3>
          <button type="button" class="close-btn" @click="isEditUserModalOpen = false">✕</button>
        </div>

        <form @submit.prevent="handleSaveEditedUser" class="modal-body">
          <p class="modal-desc">
            Perbarui data akun untuk <strong>{{ userToEdit?.name }}</strong>.
            <span v-if="authStore.isSuperAdmin">Sebagai Super Admin, Anda dapat mengubah nama, email, peran, kata sandi baru, dan izin halaman.</span>
            <span v-else>Sebagai Admin, Anda dapat mengatur nama, kata sandi baru, dan izin halaman untuk Editor ini.</span>
          </p>

          <!-- TAUTAN UNDANGAN JIKA STATUS DINONAKTIFKAN / BELUM AKTIF -->
          <div v-if="userToEdit?.status !== 'ACTIVE'" class="edit-invite-box">
            <div class="label-row">
              <label class="form-label font-bold text-navy">
                <Key :size="15" />
                <span>Tautan Undangan / Aktivasi Akun</span>
              </label>
              <span class="status-badge" :class="userToEdit?.status === 'DISABLED' ? 'disabled' : 'pending'">
                {{ userToEdit?.status === 'DISABLED' ? 'Akun Dinonaktifkan' : 'Menunggu Aktivasi' }}
              </span>
            </div>
            <p class="field-hint">
              Akun ini belum berstatus aktif. Anda dapat menyalin tautan undangan berikut untuk mengaktifkan akun:
            </p>
            <div class="invite-copy-group">
              <input
                type="text"
                readonly
                :value="isLoadingInviteUrl ? 'Memuat tautan undangan...' : editUserInviteUrl"
                class="form-input invite-url-input"
                placeholder="Memuat tautan undangan..."
                @click="($event.target as HTMLInputElement).select()"
              />
              <button
                type="button"
                class="btn btn-secondary btn-sm"
                @click="copyEditInviteUrl"
                :disabled="!editUserInviteUrl || isLoadingInviteUrl"
                title="Salin tautan ke papan klip"
              >
                <CheckCircle v-if="hasCopiedEditInvite" :size="15" class="text-success" />
                <Copy v-else :size="15" />
                <span>{{ hasCopiedEditInvite ? 'Tersalin!' : 'Salin' }}</span>
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                @click="fetchOrCreateInviteUrl(userToEdit!.id)"
                :disabled="isLoadingInviteUrl"
                title="Buat ulang tautan baru (berlaku 24 jam)"
              >
                <RefreshCw :size="14" :class="{ 'spin-anim': isLoadingInviteUrl }" />
                <span>Baru</span>
              </button>
            </div>
          </div>

          <!-- NAMA -->
          <div class="form-group">
            <label class="form-label">Nama Lengkap Pengurus</label>
            <input
              v-model="editUserName"
              type="text"
              required
              class="form-input"
              placeholder="Contoh: Yohana Manuhutu"
            />
          </div>

          <!-- EMAIL -->
          <div class="form-group">
            <div class="label-row">
              <label class="form-label">Alamat Email</label>
              <span v-if="authStore.isSuperAdmin" class="email-perm-badge super">Super Admin</span>
              <span v-else class="email-perm-badge readonly">Hanya Baca</span>
            </div>
            <input
              v-model="editUserEmail"
              type="email"
              required
              :readonly="!authStore.isSuperAdmin"
              class="form-input"
              :class="{ 'is-readonly': !authStore.isSuperAdmin }"
            />
            <p v-if="!authStore.isSuperAdmin" class="field-hint">
              Hanya Super Admin yang berwenang mengubah alamat email pengguna.
            </p>
          </div>

          <!-- ROLE / PERAN PENGURUS (HANYA SUPER ADMIN BISA MENGUBAH) -->
          <div v-if="authStore.isSuperAdmin" class="form-group role-selector-group">
            <label class="form-label">Peran Akun Pengurus</label>
            <div class="role-button-group">
              <button
                type="button"
                class="role-pill-btn"
                :class="{ 'is-active': editUserRole === 'ADMIN' }"
                @click="editUserRole = 'ADMIN'"
              >
                <Shield :size="16" />
                <span>Admin (Akses Penuh)</span>
              </button>
              <button
                type="button"
                class="role-pill-btn"
                :class="{ 'is-active': editUserRole === 'EDITOR' }"
                @click="setRoleToEditor"
              >
                <Edit3 :size="16" />
                <span>Jadikan Editor</span>
              </button>
            </div>
            <p class="field-hint">
              <span v-if="editUserRole === 'ADMIN'">
                Akun Admin memiliki wewenang penuh ke seluruh fitur dan pengaturan pengurus.
              </span>
              <span v-else>
                Akun Editor hanya dapat mengelola halaman yang diberi tanda centang pada daftar izin di bawah.
              </span>
            </p>
          </div>

          <!-- KATA SANDI BARU (TIDAK PERLU SANDI LAMA) -->
          <div class="form-group perms-section">
            <div class="label-row">
              <label class="form-label">Ganti Kata Sandi Akun Ini (Opsional)</label>
              <span class="email-perm-badge super">Tanpa Sandi Lama</span>
            </div>
            <input
              v-model="editUserPassword"
              type="password"
              class="form-input"
              placeholder="Minimal 8 karakter (kosongkan jika tidak diubah)"
            />
            <p class="field-hint">
              Kosongkan field ini jika tidak ingin mengubah kata sandi. Jika diisi, kata sandi akun ini akan langsung diperbarui tanpa perlu memasukkan kata sandi sebelumnya.
            </p>
          </div>

          <!-- PERIZINAN HALAMAN JIKA EDITOR -->
          <div v-if="editUserRole === 'EDITOR'" class="form-group perms-section">
            <div class="label-row">
              <label class="form-label">Izin Akses Halaman Editor:</label>
              <div class="perm-quick-actions">
                <button type="button" class="btn-link-sm" @click="selectAllEditPermissions">Pilih Semua</button>
                <span class="text-muted">•</span>
                <button type="button" class="btn-link-sm" @click="clearAllEditPermissions">Hapus Semua</button>
              </div>
            </div>
            <p class="field-hint">
              Centang modul/halaman yang boleh dikelola oleh akun Editor ini. Halaman yang tidak dicentang akan otomatis dikunci.
            </p>
            <div class="perms-checkboxes-grid">
              <label
                v-for="page in AVAILABLE_PAGE_PERMISSIONS"
                :key="page.key"
                class="perm-checkbox-item"
                :class="{ 'is-checked': editUserPermissions.includes(page.key) }"
              >
                <input
                  type="checkbox"
                  :checked="editUserPermissions.includes(page.key)"
                  @change="toggleEditPermission(page.key)"
                />
                <component :is="page.icon" :size="16" />
                <span class="perm-title-text">{{ page.label }}</span>
              </label>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="isEditUserModalOpen = false">
              Batal
            </button>
            <button type="submit" class="btn btn-primary" :disabled="isSavingUser">
              <Save :size="16" />
              <span>{{ isSavingUser ? 'Menyimpan...' : 'Simpan Perubahan Akun' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-admin {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.admin-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.page-title {
  font-size: 1.75rem;
  margin: 0;
  color: var(--navy);
}

.page-desc {
  color: var(--muted);
  font-size: 0.92rem;
  margin-top: 2px;
}

.reload-btn {
  display: flex;
  align-items: center;
  gap: 8px;
}

.spin-anim {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* ALERTS */
.alert-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
}

.success-alert {
  background: #f0fdf4;
  border: 1px solid #86efac;
  color: #15803d;
}

.error-alert {
  background: #fef2f2;
  border: 1px solid #fca5a5;
  color: #b91c1c;
}

/* TABS */
.tabs-nav {
  display: flex;
  gap: var(--space-2);
  padding: 6px;
  width: fit-content;
  flex-wrap: wrap;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--muted);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  color: var(--ink);
  background: #f1f5f9;
}

.tab-btn.is-active {
  background: var(--navy);
  color: var(--gold);
  font-weight: 600;
}

.tab-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 1px 6px;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
}

.tab-badge.info {
  background: #0284c7;
  color: white;
}

.tab-pane {
  padding: var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.pane-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--border);
  gap: var(--space-4);
}

.pane-title {
  font-size: 1.35rem;
  margin: 0;
  color: var(--navy);
}

.pane-desc {
  font-size: 0.85rem;
  color: var(--muted);
  margin-top: 4px;
  line-height: 1.5;
}

/* INVITE BANNER */
.invite-success-banner {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  background: #f0fdf4;
  border: 1.5px solid #86efac;
  border-radius: var(--radius-md);
}

.invite-badge {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-full);
  background: #dcfce7;
  color: #15803d;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.invite-content {
  flex: 1;
}

.invite-title {
  font-size: 1rem;
  font-weight: 700;
  color: #15803d;
  margin: 0 0 4px;
}

.invite-desc {
  font-size: 0.85rem;
  color: #166534;
  margin: 0 0 10px;
}

.invite-input-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.invite-url-field {
  font-family: monospace;
  font-size: 0.82rem;
  background: white;
  flex: 1;
}

/* FORMS */
.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

@media (min-width: 680px) {
  .form-grid {
    grid-template-columns: 1fr 1fr;
  }

  .full-width {
    grid-column: span 2;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 0.85rem;
  font-weight: 600;
}

.form-input {
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.95rem;
  background: white;
}

.form-input:focus {
  outline: none;
  border-color: var(--navy);
  box-shadow: 0 0 0 3px rgba(12, 43, 138, 0.1);
}

.field-hint {
  font-size: 0.78rem;
  color: var(--muted);
  margin-top: 4px;
}

/* PERMISSIONS PICKER */
.perms-section {
  background: #f8fafc;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}

.perms-checkboxes-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 6px;
}

.perm-checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
}

.perms-picker-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}

.perm-picker-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--border);
  cursor: pointer;
  transition: all 0.2s ease;
  background: #f8fafc;
}

.perm-picker-item.is-selected {
  background: #eff6ff;
  border-color: #60a5fa;
}

.perm-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.perm-picker-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.perm-picker-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--ink);
}

.perm-picker-path {
  font-size: 0.78rem;
  color: var(--muted);
}

/* DATA TABLE */
.users-table-wrap,
.logs-table-wrap {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.9rem;
}

.data-table th {
  padding: 12px 16px;
  background: #f8fafc;
  color: var(--muted);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--border);
}

.data-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #edf2f7;
  vertical-align: middle;
}

.text-right {
  text-align: right;
}

.text-center {
  text-align: center;
}

.user-meta-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar-badge {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: #e2e8f0;
  color: var(--navy);
  font-weight: 700;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-name-strong {
  font-weight: 600;
  color: var(--ink);
}

.user-email-muted {
  font-size: 0.78rem;
  color: var(--muted);
}

.current-user-tag {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--teal);
  text-transform: uppercase;
}

.role-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  display: inline-block;
}

.role-badge.super {
  background: #fef3c7;
  color: #92400e;
}

.role-badge.admin {
  background: #dbeafe;
  color: #1e40af;
}

.role-badge.editor {
  background: #e0f2fe;
  color: #0369a1;
}

/* PERMISSIONS TAGS IN TABLE */
.perm-full-tag {
  font-size: 0.78rem;
  font-weight: 600;
  color: #1e40af;
  background: #dbeafe;
  padding: 3px 8px;
  border-radius: var(--radius-full);
}

.perm-tags-list {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.perm-tag {
  font-size: 0.72rem;
  font-weight: 600;
  background: #f1f5f9;
  color: #334155;
  padding: 2px 7px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border);
}

.perm-tag.none {
  background: #fee2e2;
  color: #991b1b;
  border-color: #fca5a5;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.green {
  background: #16a34a;
}

.status-dot.yellow {
  background: #ca8a04;
}

.status-dot.red {
  background: #dc2626;
}

.status-badge.active {
  color: #15803d;
}

.status-badge.pending {
  color: #a16207;
}

.status-badge.disabled {
  color: #991b1b;
}

.sessions-count {
  font-size: 0.82rem;
  color: var(--muted);
}

.sessions-count.has-sessions {
  color: var(--teal);
  font-weight: 600;
}

.table-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 8px;
  font-size: 0.78rem;
  font-weight: 600;
  border-radius: var(--radius-sm);
  background: #f1f5f9;
  border: 1px solid var(--border);
  color: var(--ink);
  cursor: pointer;
  transition: all 0.15s ease;
}

.action-btn:hover {
  background: #e2e8f0;
}

.action-btn.info {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1d4ed8;
}

.action-btn.info:hover {
  background: #dbeafe;
}

.action-btn.warning {
  color: #b45309;
}

.action-btn.danger {
  color: #dc2626;
}

.action-btn.success {
  color: #15803d;
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* MATRIX PER USER TAB */
.th-perm-head {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.perm-toggle-cell {
  padding: 10px !important;
}

.toggle-perm-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  background: #f8fafc;
  border: 1px solid var(--border);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.toggle-perm-btn:hover {
  background: #f1f5f9;
}

.toggle-perm-btn.is-active {
  background: #f0fdf4;
  border-color: #86efac;
}

.perm-status-text {
  font-size: 0.75rem;
}

.empty-matrix-card {
  padding: 40px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  background: #f8fafc;
}

.empty-matrix-title {
  font-size: 1.15rem;
  margin: 0;
  color: var(--navy);
}

.empty-matrix-desc {
  font-size: 0.88rem;
  color: var(--muted);
  max-width: 480px;
  margin: 0 0 8px;
  line-height: 1.5;
}

/* METRICS GRID */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-4);
}

.metric-card {
  padding: var(--space-5);
  background: #f8fafc;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
}

.metric-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-value {
  font-size: 2rem;
  font-weight: 800;
  margin: 6px 0 2px;
}

.metric-desc {
  font-size: 0.75rem;
  color: var(--muted);
}

.text-success {
  color: #15803d;
}

.text-warning {
  color: #d97706;
}

.text-danger {
  color: #dc2626;
}

.text-primary {
  color: var(--navy);
}

/* SUB SECTIONS */
.sub-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border);
}

.sub-section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sub-title {
  font-size: 1.1rem;
  margin: 0;
  color: var(--navy);
}

.sub-desc {
  font-size: 0.82rem;
  color: var(--muted);
  margin-top: 2px;
}

/* SESSIONS LIST */
.sessions-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.session-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: 14px 18px;
  background: #f8fafc;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.session-card.is-current {
  background: #f0fdf4;
  border-color: #86efac;
}

.session-icon {
  color: var(--teal);
  flex-shrink: 0;
}

.session-info {
  flex: 1;
}

.session-device-line {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
}

.current-session-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-full);
  background: #15803d;
  color: white;
}

.session-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  color: var(--muted);
  margin-top: 4px;
}

.danger-text {
  color: #dc2626;
}

/* EVENT BADGES */
.event-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  font-family: monospace;
}

.badge-green {
  background: #dcfce7;
  color: #166534;
}

.badge-red {
  background: #fee2e2;
  color: #991b1b;
}

.badge-blue {
  background: #e0f2fe;
  color: #0369a1;
}

.event-meta-cell {
  font-size: 0.8rem;
  font-family: monospace;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-cell {
  text-align: center;
  padding: 30px !important;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-size: 0.9rem;
}

/* MODALS */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: var(--space-4);
}

.modal-dialog {
  width: 100%;
  max-width: 520px;
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
  background: white;
}

.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.modal-title {
  font-size: 1.25rem;
  margin: 0;
  color: var(--navy);
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.25rem;
  color: var(--muted);
  cursor: pointer;
  padding: 4px 8px;
}

.close-btn:hover {
  color: var(--ink);
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.modal-desc {
  font-size: 0.88rem;
  color: var(--muted);
  line-height: 1.5;
  margin: 0;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.btn-danger {
  background: #dc2626;
  color: white;
  border: 1px solid #b91c1c;
}

.btn-danger:hover {
  background: #b91c1c;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.8rem;
}

.perm-quick-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-link-sm {
  background: none;
  border: none;
  padding: 0;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--blue, #0284c7);
  cursor: pointer;
  text-decoration: underline;
}

.btn-link-sm:hover {
  color: var(--navy, #1e3a8a);
}

.action-btn.delete-btn {
  color: #dc2626;
  border-color: #fecaca;
  background: #fef2f2;
}

.action-btn.delete-btn:hover {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #b91c1c;
}

.edit-invite-box {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 4px;
}

.invite-copy-group {
  display: flex;
  gap: 6px;
  align-items: center;
}

.invite-url-input {
  font-size: 0.8rem;
  background: white;
  font-family: monospace;
}

.role-button-group {
  display: flex;
  gap: 10px;
  margin-top: 6px;
}

.role-pill-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: var(--radius-sm);
  font-size: 0.88rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
}

.role-pill-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #1e293b;
}

.role-pill-btn.is-active {
  background: #eff6ff;
  border-color: #2563eb;
  color: #1d4ed8;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}
</style>
