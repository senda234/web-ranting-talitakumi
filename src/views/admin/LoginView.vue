<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Lock, Mail, Eye, EyeOff, LogIn, AlertCircle, Info } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const errorMessage = ref('');
const infoMessage = ref('');

function parseUrlError() {
  const err = route.query.error as string;
  if (!err) return;

  switch (err) {
    case 'not_invited':
      errorMessage.value = 'Email Google ini belum didaftarkan oleh Super Admin.';
      break;
    case 'disabled':
      errorMessage.value = 'Akun tidak aktif. Hubungi Super Admin.';
      break;
    case 'cancelled':
      infoMessage.value = 'Proses masuk dengan Google dibatalkan.';
      break;
    default:
      errorMessage.value = 'Gagal memproses login Google. Silakan coba kembali.';
  }
}

onMounted(async () => {
  parseUrlError();
  await authStore.fetchGoogleConfig();
});

function handleGoogleLogin() {
  errorMessage.value = '';
  infoMessage.value = '';

  const clientId = authStore.googleClientId;
  const redirectUri = `${window.location.origin}/api/auth/callback/google`;

  if (!clientId) {
    errorMessage.value = 'Google Client ID belum diatur di .env. Anda dapat masuk langsung menggunakan formulir email dan kata sandi di bawah.';
    return;
  }

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', clientId);
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('access_type', 'offline');
  googleAuthUrl.searchParams.set('prompt', 'select_account');

  window.location.href = googleAuthUrl.toString();
}

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
              placeholder="admin@talitakumi.org"
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

      <!-- PEMBATAS (DIVIDER) -->
      <div class="divider">
        <span>atau masuk dengan akun terverifikasi</span>
      </div>

      <!-- TOMBOL GOOGLE SIGN-IN -->
      <div class="google-section">
        <button
          type="button"
          class="btn-google"
          @click="handleGoogleLogin"
          :disabled="authStore.isLoading"
        >
          <svg class="google-icon" viewBox="0 0 24 24" width="18" height="18">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Masuk dengan Google</span>
        </button>
        <p class="google-note">
          Hanya email Google yang telah didaftarkan oleh Super Admin yang memiliki akses.
        </p>
      </div>

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
