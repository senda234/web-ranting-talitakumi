<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Lock, Mail, Eye, EyeOff, LogIn, AlertCircle, Info } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notifications';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const errorMessage = ref('');
const infoMessage = ref('');

watch(errorMessage, (newVal) => {
  if (newVal) {
    notificationStore.error('Gagal Masuk', newVal);
  }
});

async function handleManualSubmit() {
  if (!email.value || !password.value) {
    errorMessage.value = 'Silakan masukkan email dan kata sandi.';
    return;
  }

  errorMessage.value = '';
  infoMessage.value = '';

  const result = await authStore.login(email.value, password.value);
  if (result.success) {
    const redirect = (route.query.redirect as string) || '/admin';
    router.push(redirect);
  } else {
    errorMessage.value = result.message || 'Kredensial tidak valid. Silakan periksa kembali email atau kata sandi.';
  }
}
</script>

<template>
  <div class="login-wrapper">
    <div class="login-box card">
      <!-- HEADER -->
      <div class="login-header">
        <div class="brand-badge" aria-hidden="true">RT</div>
        <h1 class="login-title">Portal Pengurus Talitakumi</h1>
        <p class="login-subtitle">
          Sistem Informasi & Panel Kelola Web Ranting Talitakumi
        </p>
      </div>

      <!-- ALERT MESSAGE -->
      <div v-if="errorMessage" class="alert-box error" role="alert">
        <AlertCircle :size="18" class="alert-icon" />
        <span>{{ errorMessage }}</span>
      </div>

      <div v-if="infoMessage" class="alert-box info" role="status">
        <Info :size="18" class="alert-icon" />
        <span>{{ infoMessage }}</span>
      </div>

      <!-- FORM LOGIN UTAMA (EMAIL & PASSWORD) -->
      <form @submit.prevent="handleManualSubmit" class="login-form">
        <div class="form-field">
          <label for="admin-email" class="form-label">Alamat Email</label>
          <div class="input-wrap">
            <Mail :size="18" class="field-icon" aria-hidden="true" />
            <input
              id="admin-email"
              v-model="email"
              type="email"
              required
              autocomplete="username"
              placeholder="nama@email.com"
              class="form-input"
              :disabled="authStore.isLoading"
            />
          </div>
        </div>

        <div class="form-field">
          <label for="admin-password" class="form-label">Kata Sandi</label>
          <div class="input-wrap">
            <Lock :size="18" class="field-icon" aria-hidden="true" />
            <input
              id="admin-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              autocomplete="current-password"
              placeholder="••••••••••••"
              class="form-input"
              :disabled="authStore.isLoading"
            />
            <button
              type="button"
              class="toggle-pass-btn"
              @click="showPassword = !showPassword"
              :aria-label="showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'"
            >
              <EyeOff v-if="showPassword" :size="18" />
              <Eye v-else :size="18" />
            </button>
          </div>
        </div>

        <button type="submit" class="btn btn-primary submit-btn" :disabled="authStore.isLoading">
          <LogIn :size="18" aria-hidden="true" />
          <span>{{ authStore.isLoading ? 'Memverifikasi...' : 'Masuk ke Dashboard' }}</span>
        </button>
      </form>

      <!-- FOOTER -->
      <div class="login-footer">
        <RouterLink to="/" class="home-link">← Kembali ke Situs Publik</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top, #0c2b8a 0%, var(--navy-dark) 100%);
  padding: var(--space-4);
}

.login-box {
  width: 100%;
  max-width: 440px;
  padding: var(--space-8);
  border-radius: var(--radius-lg);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
  background: white;
}

.login-header {
  text-align: center;
  margin-bottom: var(--space-6);
}

.brand-badge {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-md);
  background: var(--navy);
  color: var(--gold);
  border: 2px solid var(--gold);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.25rem;
  margin: 0 auto var(--space-3);
  letter-spacing: 1px;
}

.login-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--navy);
  margin-bottom: var(--space-1);
}

.login-subtitle {
  font-size: 0.86rem;
  color: var(--muted);
  line-height: 1.4;
}

.alert-box {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.84rem;
  line-height: 1.45;
  margin-bottom: var(--space-4);
}

.alert-box.error {
  background: #fef2f2;
  border: 1px solid #fca5a5;
  color: #991b1b;
}

.alert-box.info {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
}

.alert-icon {
  flex-shrink: 0;
  margin-top: 1px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ink);
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
  transition: all 0.2s ease;
  background: white;
}

.form-input:focus {
  outline: none;
  border-color: var(--navy);
  box-shadow: 0 0 0 3px rgba(12, 43, 138, 0.12);
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

.submit-btn {
  width: 100%;
  padding: 12px;
  justify-content: center;
  font-size: 0.95rem;
  font-weight: 600;
  margin-top: var(--space-2);
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: var(--space-5) 0 var(--space-4);
  font-size: 0.78rem;
  color: var(--muted);
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid var(--border-light);
}

.divider span {
  padding: 0 10px;
}

.google-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-google {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 11px 16px;
  background: #ffffff;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.btn-google:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.google-note {
  font-size: 0.76rem;
  color: var(--muted);
  text-align: center;
  margin: 0;
  line-height: 1.35;
}

.login-footer {
  text-align: center;
  margin-top: var(--space-6);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border-light);
}

.home-link {
  font-size: 0.84rem;
  color: var(--muted);
  text-decoration: none;
  transition: color 0.2s;
}

.home-link:hover {
  color: var(--navy);
}
</style>
