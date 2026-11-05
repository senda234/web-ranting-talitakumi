<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  CheckCircle,
  AlertCircle,
  Shield,
  Clock,
  Key,
  Calendar,
  Layers,
} from 'lucide-vue-next';

const authStore = useAuthStore();

const name = ref('');
const email = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);

const isLoading = ref(false);
const isSaving = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

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

async function loadProfile() {
  isLoading.value = true;
  try {
    const res = await fetch('/api/me/profile');
    if (res.ok) {
      const data = await res.json();
      const u = data.data || data;
      name.value = u.name || '';
      email.value = u.email || '';
    } else {
      // Fallback from auth store
      name.value = authStore.user?.name || '';
      email.value = authStore.user?.email || '';
    }
  } catch {
    name.value = authStore.user?.name || '';
    email.value = authStore.user?.email || '';
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadProfile();
});

async function handleSubmit() {
  errorMessage.value = '';
  successMessage.value = '';

  if (!name.value.trim()) {
    errorMessage.value = 'Nama lengkap wajib diisi.';
    return;
  }

  // Jika mengisi password baru
  if (newPassword.value) {
    if (newPassword.value.length < 8) {
      errorMessage.value = 'Kata sandi baru minimal harus 8 karakter.';
      return;
    }
    if (newPassword.value !== confirmPassword.value) {
      errorMessage.value = 'Konfirmasi kata sandi tidak cocok dengan kata sandi baru.';
      return;
    }
  }

  isSaving.value = true;

  try {
    const payload: Record<string, string> = {
      name: name.value.trim(),
    };

    // Khusus Super Admin: bisa edit email sendiri
    if (authStore.isSuperAdmin && email.value.trim()) {
      payload.email = email.value.trim();
    }

    // Mengganti sandi tanpa perlu sandi lama
    if (newPassword.value) {
      payload.password = newPassword.value;
    }

    const res = await fetch('/api/me/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      errorMessage.value = data.message || data.error || 'Gagal memperbarui profil.';
      return;
    }

    successMessage.value = 'Profil dan kata sandi Anda berhasil diperbarui!';
    newPassword.value = '';
    confirmPassword.value = '';

    // Update store state
    if (authStore.user) {
      authStore.user.name = name.value.trim();
      if (payload.email) {
        authStore.user.email = payload.email;
      }
    }

    setTimeout(() => {
      successMessage.value = '';
    }, 4000);
  } catch (err: any) {
    errorMessage.value = 'Terjadi kesalahan sistem: ' + err.message;
  } finally {
    isSaving.value = false;
  }
}
</script>

<template>
  <div class="profile-view">
    <div class="admin-page-header">
      <div>
        <h1 class="page-title">Profil & Keamanan Akun</h1>
        <p class="page-desc">Kelola nama pengurus, alamat email, dan pembaruan kata sandi akun Anda.</p>
      </div>
    </div>

    <!-- ALERTS -->
    <div v-if="successMessage" class="alert-box success-alert" role="alert">
      <CheckCircle :size="18" />
      <span>{{ successMessage }}</span>
    </div>

    <div v-if="errorMessage" class="alert-box error-alert" role="alert">
      <AlertCircle :size="18" />
      <span>{{ errorMessage }}</span>
    </div>

    <div class="profile-layout-grid">
      <!-- KARTU INFORMASI AKUN (SIDEBAR KIRI) -->
      <aside class="profile-sidebar card">
        <div class="user-avatar-hero">
          {{ (name || 'P').slice(0, 2).toUpperCase() }}
        </div>
        <h2 class="user-hero-name">{{ name || 'Pengurus' }}</h2>
        <div class="user-hero-email">{{ email || '-' }}</div>

        <div class="user-badge-row">
          <span class="role-badge" :class="roleClass">
            {{ roleLabel }}
          </span>
          <span class="status-badge active">
            <span class="status-dot green"></span> Aktif
          </span>
        </div>

        <hr class="divider" />

        <div class="info-list">
          <div class="info-item">
            <Shield :size="16" class="info-icon" />
            <div>
              <div class="info-label">Tingkat Hak Akses</div>
              <div class="info-value">
                <span v-if="authStore.isSuperAdmin">Super Admin (Akses Mutlak)</span>
                <span v-else-if="authStore.isAdmin">Admin (Akses Seluruh Modul)</span>
                <span v-else>Editor (Izin Halaman Spesifik)</span>
              </div>
            </div>
          </div>

          <div class="info-item">
            <Key :size="16" class="info-icon" />
            <div>
              <div class="info-label">Ganti Kata Sandi</div>
              <div class="info-value text-muted">Langsung tanpa kata sandi lama</div>
            </div>
          </div>

          <div class="info-item">
            <Mail :size="16" class="info-icon" />
            <div>
              <div class="info-label">Ubah Alamat Email</div>
              <div class="info-value">
                <span v-if="authStore.isSuperAdmin" class="text-success font-semibold">Tersedia untuk Super Admin</span>
                <span v-else class="text-muted">Hanya Super Admin</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- FORM SUNting PROFIL & GANTI KATA SANDI (KANAN) -->
      <main class="profile-main-form card">
        <form @submit.prevent="handleSubmit" class="form-container">
          <!-- BAGIAN 1: DATA PROFIL -->
          <div class="form-section">
            <h3 class="section-title">
              <User :size="18" class="section-icon" />
              <span>Data Akun Pengurus</span>
            </h3>
            <p class="section-desc">Identitas diri yang ditampilkan pada panel admin dan log audit.</p>

            <div class="form-grid">
              <div class="form-group">
                <label for="profile-name" class="form-label">Nama Lengkap Pengurus</label>
                <div class="input-wrap">
                  <User :size="16" class="field-icon" />
                  <input
                    id="profile-name"
                    v-model="name"
                    type="text"
                    required
                    class="form-input"
                    placeholder="Contoh: Yohana Manuhutu"
                  />
                </div>
              </div>

              <div class="form-group">
                <div class="label-row">
                  <label for="profile-email" class="form-label">Alamat Email Resmi</label>
                  <span v-if="authStore.isSuperAdmin" class="email-perm-badge super">Dapat Diubah</span>
                  <span v-else class="email-perm-badge readonly">Hanya Baca</span>
                </div>
                <div class="input-wrap">
                  <Mail :size="16" class="field-icon" />
                  <input
                    id="profile-email"
                    v-model="email"
                    type="email"
                    required
                    :readonly="!authStore.isSuperAdmin"
                    class="form-input"
                    :class="{ 'is-readonly': !authStore.isSuperAdmin }"
                    placeholder="nama@talitakumi.org"
                  />
                </div>
                <p v-if="authStore.isSuperAdmin" class="field-hint text-success">
                  Sebagai Super Admin, Anda dapat memperbarui alamat email akun Anda sendiri.
                </p>
                <p v-else class="field-hint">
                  Alamat email dikunci demi integritas audit. Hubungi Super Admin jika perlu perubahan email.
                </p>
              </div>
            </div>
          </div>

          <hr class="divider" />

          <!-- BAGIAN 2: GANTI KATA SANDI -->
          <div class="form-section">
            <h3 class="section-title">
              <Key :size="18" class="section-icon" />
              <span>Ganti Kata Sandi</span>
            </h3>
            <p class="section-desc">
              Anda dapat mengganti kata sandi kapan saja <strong>tanpa perlu memasukkan kata sandi lama</strong>.
              Kosongkan field ini jika Anda tidak ingin mengubah kata sandi.
            </p>

            <div class="form-grid">
              <div class="form-group">
                <label for="new-password" class="form-label">Kata Sandi Baru</label>
                <div class="input-wrap">
                  <Lock :size="16" class="field-icon" />
                  <input
                    id="new-password"
                    v-model="newPassword"
                    :type="showPassword ? 'text' : 'password'"
                    autocomplete="new-password"
                    class="form-input"
                    placeholder="Minimal 8 karakter"
                  />
                  <button
                    type="button"
                    class="toggle-pass-btn"
                    @click="showPassword = !showPassword"
                    :aria-label="showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'"
                  >
                    <EyeOff v-if="showPassword" :size="16" />
                    <Eye v-else :size="16" />
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label for="confirm-password" class="form-label">Konfirmasi Kata Sandi Baru</label>
                <div class="input-wrap">
                  <Lock :size="16" class="field-icon" />
                  <input
                    id="confirm-password"
                    v-model="confirmPassword"
                    :type="showPassword ? 'text' : 'password'"
                    autocomplete="new-password"
                    class="form-input"
                    placeholder="Ketik ulang kata sandi baru"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- SUBMIT BUTTON -->
          <div class="form-actions">
            <button type="submit" class="btn btn-primary submit-btn" :disabled="isSaving">
              <Save :size="16" />
              <span>{{ isSaving ? 'Menyimpan Perubahan...' : 'Simpan Profil & Sandi' }}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  </div>
</template>

<style scoped>
.profile-view {
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
  color: var(--navy);
}

.page-desc {
  color: var(--muted);
  font-size: 0.92rem;
  margin-top: 2px;
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

/* LAYOUT GRID */
.profile-layout-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
  align-items: flex-start;
}

@media (min-width: 900px) {
  .profile-layout-grid {
    grid-template-columns: 320px 1fr;
  }
}

/* SIDEBAR KIRI */
.profile-sidebar {
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.user-avatar-hero {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--navy), #1e3a8a);
  color: var(--gold);
  border: 2px solid var(--gold);
  font-size: 1.75rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-3);
  letter-spacing: 1px;
}

.user-hero-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--navy);
  margin: 0 0 4px;
}

.user-hero-email {
  font-size: 0.85rem;
  color: var(--muted);
  word-break: break-all;
  margin-bottom: var(--space-3);
}

.user-badge-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.role-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: var(--radius-full);
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

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
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

.divider {
  width: 100%;
  border: none;
  border-top: 1px solid var(--border);
  margin: var(--space-5) 0;
}

.info-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  text-align: left;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.info-icon {
  color: var(--teal);
  margin-top: 2px;
  flex-shrink: 0;
}

.info-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
}

.info-value {
  font-size: 0.88rem;
  color: var(--ink);
  font-weight: 500;
  margin-top: 2px;
}

/* MAIN FORM */
.profile-main-form {
  padding: var(--space-8);
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.15rem;
  margin: 0;
  color: var(--navy);
}

.section-icon {
  color: var(--teal);
}

.section-desc {
  font-size: 0.85rem;
  color: var(--muted);
  margin: 0;
  line-height: 1.5;
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
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ink);
}

.email-perm-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: var(--radius-full);
}

.email-perm-badge.super {
  background: #dcfce7;
  color: #166534;
}

.email-perm-badge.readonly {
  background: #f1f5f9;
  color: var(--muted);
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.field-icon {
  position: absolute;
  left: 12px;
  color: var(--muted);
  pointer-events: none;
}

.form-input {
  width: 100%;
  padding: 10px 14px 10px 38px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
  background: white;
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--navy);
  box-shadow: 0 0 0 3px rgba(12, 43, 138, 0.1);
}

.form-input.is-readonly {
  background: #f8fafc;
  color: var(--muted);
  cursor: not-allowed;
}

.toggle-pass-btn {
  position: absolute;
  right: 10px;
  background: transparent;
  border: none;
  color: var(--muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px;
}

.toggle-pass-btn:hover {
  color: var(--navy);
}

.field-hint {
  font-size: 0.78rem;
  color: var(--muted);
  margin: 0;
  line-height: 1.4;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: var(--space-4);
  border-top: 1px solid var(--border);
}

.submit-btn {
  padding: 10px 22px;
  font-size: 0.95rem;
}
</style>

