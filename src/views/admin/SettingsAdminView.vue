<script setup lang="ts">
import { ref } from 'vue';
import { useContentStore } from '@/stores/content';
import { Shield, UserPlus, Clock, Save, Check } from 'lucide-vue-next';

const contentStore = useContentStore();
const settings = contentStore.settings;

const activeTab = ref<'identity' | 'users' | 'logs'>('identity');
const isSaved = ref(false);

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
  setTimeout(() => {
    isSaved.value = false;
  }, 2500);
}

// Sample users list for Super Admin
const users = ref([
  {
    id: 'u-1',
    name: 'Super Admin Talitakumi',
    email: 'admin@talitakumi.org',
    role: 'SUPER_ADMIN',
    isActive: true,
    lastLogin: 'Baru saja',
  },
  {
    id: 'u-2',
    name: 'Editor Publikasi',
    email: 'editor@talitakumi.org',
    role: 'EDITOR',
    isActive: true,
    lastLogin: '3 hari yang lalu',
  },
]);

// Sample audit logs
const logs = ref([
  {
    id: 'l-1',
    action: 'Login Admin',
    user: 'admin@talitakumi.org',
    time: 'Hari ini, 13:45',
    details: 'Berhasil masuk ke portal pengurus',
  },
  {
    id: 'l-2',
    action: 'Pembaruan Teks',
    user: 'admin@talitakumi.org',
    time: 'Kemarin, 19:20',
    details: 'Memperbarui slogan dan pengantar Beranda',
  },
  {
    id: 'l-3',
    action: 'Publikasi Album',
    user: 'admin@talitakumi.org',
    time: '4 Nov 2026',
    details: 'Menerbitkan album SBC (Study Bible Camp )',
  },
]);
</script>

<template>
  <div class="settings-admin">
    <div class="admin-page-header">
      <div>
        <h1 class="page-title">Pengaturan Sistem</h1>
        <p class="page-desc">Kelola identitas organisasi, akses pengguna, dan rekam aktivitas.</p>
      </div>
    </div>

    <!-- TABS -->
    <div class="tabs-nav card">
      <button type="button" class="tab-btn" :class="{ 'is-active': activeTab === 'identity' }"
        @click="activeTab = 'identity'">
        <span>Identitas Lembaga</span>
      </button>
      <button type="button" class="tab-btn" :class="{ 'is-active': activeTab === 'users' }"
        @click="activeTab = 'users'">
        <span>Pengguna & Hak Akses</span>
      </button>
      <button type="button" class="tab-btn" :class="{ 'is-active': activeTab === 'logs' }" @click="activeTab = 'logs'">
        <span>Log Aktivitas</span>
      </button>
    </div>

    <!-- TAB 1: IDENTITAS -->
    <section v-if="activeTab === 'identity'" class="tab-pane card">
      <div class="pane-head">
        <h2 class="pane-title">Identitas Organisasi Gereja</h2>
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

    <!-- TAB 2: PENGGUNA -->
    <section v-if="activeTab === 'users'" class="tab-pane card">
      <div class="pane-head">
        <div>
          <h2 class="pane-title">Akun Pengurus & Hak Akses</h2>
          <p class="pane-desc">Hanya akun terdaftar yang dapat masuk. Pendaftaran mandiri ditutup.</p>
        </div>
      </div>

      <div class="users-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nama Pengguna</th>
              <th>Email</th>
              <th>Peran</th>
              <th>Status</th>
              <th>Login Terakhir</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>
                <strong>{{ user.name }}</strong>
              </td>
              <td>{{ user.email }}</td>
              <td>
                <span class="role-badge" :class="user.role === 'SUPER_ADMIN' ? 'super' : 'editor'">
                  {{ user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Editor' }}
                </span>
              </td>
              <td>
                <span class="status-badge active">Aktif</span>
              </td>
              <td class="text-muted">{{ user.lastLogin }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- TAB 3: LOG AKTIVITAS -->
    <section v-if="activeTab === 'logs'" class="tab-pane card">
      <div class="pane-head">
        <div>
          <h2 class="pane-title">Log Audit Aktivitas</h2>
          <p class="pane-desc">Catatan perubahan data, login, dan aksi penting admin.</p>
        </div>
      </div>

      <div class="logs-list">
        <div v-for="log in logs" :key="log.id" class="log-item">
          <div class="log-icon-wrap">
            <Clock :size="18" />
          </div>
          <div class="log-info">
            <div class="log-line">
              <strong class="log-action">{{ log.action }}</strong>
              <span class="log-user">oleh {{ log.user }}</span>
            </div>
            <p class="log-details">{{ log.details }}</p>
          </div>
          <div class="log-time">{{ log.time }}</div>
        </div>
      </div>
    </section>
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
}

.page-title {
  font-size: 1.75rem;
  margin: 0;
}

.page-desc {
  color: var(--muted);
  font-size: 0.92rem;
  margin-top: 2px;
}

.tabs-nav {
  display: flex;
  gap: var(--space-2);
  padding: 6px;
  width: fit-content;
}

.tab-btn {
  padding: 10px 18px;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--muted);
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

.tab-pane {
  padding: var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.pane-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--border);
}

.pane-title {
  font-size: 1.35rem;
  margin: 0;
}

.pane-desc {
  font-size: 0.85rem;
  color: var(--muted);
  margin-top: 2px;
}

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
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.95rem;
}

/* DATA TABLE */
.users-table-wrap {
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
}

.role-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: var(--radius-full);
}

.role-badge.super {
  background: #fef3c7;
  color: #92400e;
}

.role-badge.editor {
  background: #e0f2fe;
  color: #0369a1;
}

.status-badge.active {
  font-size: 0.75rem;
  font-weight: 600;
  color: #16a34a;
}

.text-muted {
  color: var(--muted);
  font-size: 0.82rem;
}

/* LOGS */
.logs-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.log-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: var(--radius-sm);
  border: 1px solid #edf2f7;
}

.log-icon-wrap {
  color: var(--teal);
  flex-shrink: 0;
}

.log-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.log-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.log-action {
  font-size: 0.95rem;
  color: var(--ink);
}

.log-user {
  font-size: 0.8rem;
  color: var(--muted);
}

.log-details {
  font-size: 0.82rem;
  color: #475569;
  margin: 0;
}

.log-time {
  font-size: 0.78rem;
  color: var(--muted);
}
</style>
