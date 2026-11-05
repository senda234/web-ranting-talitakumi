<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNotificationStore } from '@/stores/notifications';
import { useAuthStore } from '@/stores/auth';
import { Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, ArrowRight, AlertCircle, Info, KeyRound } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const notificationStore = useNotificationStore();
const authStore = useAuthStore();

const token = ref((route.query.token as string) || '');
const invitationData = ref<{
  name: string;
  email: string;
  role: string;
} | null>(null);

const isLoadingInvite = ref(true);
const inviteError = ref('');
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const showManualPassword = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');
const isSuccess = ref(false);

const isMinLength = computed(() => password.value.length >= 12);
const isMatch = computed(() => password.value.length > 0 && password.value === confirmPassword.value);
const canSubmitManual = computed(() => isMinLength.value && isMatch.value && !isLoading.value);

onMounted(async () => {
  await authStore.fetchGoogleConfig();

  if (!token.value) {
    inviteError.value = 'Token aktivasi tidak ditemukan. Pastikan Anda membuka tautan lengkap dari email undangan.';
    isLoadingInvite.value = false;
    return;
  }

  try {
    const res = await fetch(`/api/auth/verify-invitation?token=${encodeURIComponent(token.value)}`);
    const data = await res.json();
    if (res.ok && data.data?.invitation) {
      invitationData.value = data.data.invitation;
    } else {
      inviteError.value = data.message || data.error || 'Undangan tidak valid atau sudah kedaluwarsa.';
    }
  } catch (err: any) {
    inviteError.value = 'Gagal memverifikasi status undangan dari server.';
  } finally {
    isLoadingInvite.value = false;
  }
});

function handleGoogleConnect() {
  errorMessage.value = '';

  const clientId = authStore.googleClientId;
  const redirectUri = `${window.location.origin}/api/auth/callback/google`;

  if (!clientId) {
    errorMessage.value = 'GOOGLE_CLIENT_ID belum dikonfigurasi di file .env. Silakan gunakan opsi aktivasi sandi darurat di bawah.';
    showManualPassword.value = true;
    return;
  }

  // Redirect ke Google OAuth 2.0 Authorization Server dengan state token undangan
  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', clientId);
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('access_type', 'offline');
  googleAuthUrl.searchParams.set('prompt', 'select_account');
  googleAuthUrl.searchParams.set('state', `invite:${token.value}`);

  if (invitationData.value?.email) {
    googleAuthUrl.searchParams.set('login_hint', invitationData.value.email);
  }

  window.location.href = googleAuthUrl.toString();
}

async function handleManualActivate() {
  if (!canSubmitManual.value) return;

  isLoading.value = true;
  errorMessage.value = '';

  try {
    const res = await fetch('/api/auth/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: token.value.trim(),
        password: password.value,
        confirmPassword: confirmPassword.value,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Aktivasi gagal diproses');
    }

    isSuccess.value = true;
    localStorage.setItem('talitakumi_admin_auth', 'true');
    notificationStore.success('Akun Berhasil Diaktifkan!', 'Selamat datang di Portal Pengurus Ranting Talitakumi.');

    setTimeout(() => {
      router.push('/admin');
    }, 2000);
  } catch (err: any) {
    errorMessage.value = err.message || 'Tautan aktivasi tidak valid atau sudah kedaluwarsa.';
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="activation-page">
    <div class="activation-box card">
      <div class="header-section">
        <div class="brand-badge" aria-hidden="true">RT</div>
        <h1 class="title">Aktivasi Akun Pengurus</h1>
        <p class="subtitle">
          Sistem Pengelolaan Konten & Keamanan Web Ranting Talitakumi
        </p>
      </div>

      <!-- State Loading Verifikasi -->
      <div v-if="isLoadingInvite" class="loading-state">
        <p>Memverifikasi tautan undangan Anda...</p>
      </div>

      <!-- State Error Token / Undangan Kedaluwarsa -->
      <div v-else-if="inviteError" class="alert-box error" role="alert">
        <AlertCircle :size="20" class="alert-icon" />
        <div>
          <strong>Undangan Tidak Valid</strong>
          <p>{{ inviteError }}</p>
          <RouterLink to="/admin/login" class="link-btn">← Kembali ke Halaman Login</RouterLink>
        </div>
      </div>

      <!-- State Sukses -->
      <div v-else-if="isSuccess" class="success-banner" role="status">
        <CheckCircle2 :size="48" class="success-icon" />
        <h2>Aktivasi Berhasil!</h2>
        <p>Akun Anda telah aktif. Mengalihkan Anda ke portal admin...</p>
      </div>

      <!-- Konten Utama Aktivasi -->
      <div v-else class="activation-content">
        <!-- Info Pengguna yang Diundang -->
        <div v-if="invitationData" class="invitee-card">
          <div class="invitee-meta">
            <span class="invitee-name">{{ invitationData.name }}</span>
            <span class="invitee-email">{{ invitationData.email }}</span>
          </div>
          <span class="role-badge">{{ invitationData.role }}</span>
        </div>

        <div v-if="errorMessage" class="alert-box error" role="alert">
          <AlertCircle :size="18" class="alert-icon" />
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Tombol Utama: Hubungkan dengan Google (§8 & §11) -->
        <div class="google-activate-section">
          <p class="section-desc">
            Sesuai standar keamanan sistem, hubungkan akun Google yang terdaftar dengan email undangan Anda untuk mengaktifkan akses.
          </p>

          <button
            type="button"
            class="btn-google"
            @click="handleGoogleConnect"
            :disabled="isLoading"
          >
            <svg class="google-icon" viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Hubungkan dengan Google</span>
          </button>
        </div>

        <!-- Toggle Opsi Sandi Cadangan -->
        <div class="toggle-wrap">
          <button
            type="button"
            class="toggle-manual-btn"
            @click="showManualPassword = !showManualPassword"
          >
            <KeyRound :size="14" />
            <span>{{ showManualPassword ? 'Sembunyikan Opsi Sandi Lokal' : 'Opsi Aktivasi Sandi Lokal Cadangan' }}</span>
          </button>
        </div>

        <!-- Form Sandi Manual Cadangan -->
        <transition name="fade">
          <form v-if="showManualPassword" @submit.prevent="handleManualActivate" class="manual-form">
            <div class="form-field">
              <label for="act-password" class="form-label">Kata Sandi Baru</label>
              <div class="input-wrap">
                <Lock :size="16" class="field-icon" aria-hidden="true" />
                <input
                  id="act-password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  autocomplete="new-password"
                  placeholder="Minimal 12 karakter"
                  class="form-input"
                />
                <button
                  type="button"
                  class="toggle-pw"
                  :aria-label="showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'"
                  @click="showPassword = !showPassword"
                >
                  <EyeOff v-if="showPassword" :size="16" />
                  <Eye v-else :size="16" />
                </button>
              </div>
            </div>

            <div class="form-field">
              <label for="act-confirm" class="form-label">Konfirmasi Kata Sandi Baru</label>
              <div class="input-wrap">
                <Lock :size="16" class="field-icon" aria-hidden="true" />
                <input
                  id="act-confirm"
                  v-model="confirmPassword"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  autocomplete="new-password"
                  placeholder="Ulangi kata sandi"
                  class="form-input"
                />
              </div>
            </div>

            <div class="password-checklist">
              <div class="check-item" :class="{ 'is-met': isMinLength }">
                <span class="dot"></span>
                <span>Minimal 12 karakter</span>
              </div>
              <div class="check-item" :class="{ 'is-met': isMatch }">
                <span class="dot"></span>
                <span>Konfirmasi kata sandi cocok</span>
              </div>
            </div>

            <button
              type="submit"
              class="btn btn-secondary submit-btn"
              :disabled="!canSubmitManual"
            >
              <span>{{ isLoading ? 'Mengaktifkan akun...' : 'Aktifkan dengan Sandi' }}</span>
            </button>
          </form>
        </transition>

        <div class="footer-link">
          <RouterLink to="/admin/login" class="link-btn">← Kembali ke Halaman Login</RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.activation-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background: radial-gradient(circle at top, #0c2b8a 0%, var(--navy-dark) 100%);
}

.activation-box {
  width: 100%;
  max-width: 480px;
  background: #ffffff;
  border-radius: var(--radius-lg);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
  padding: 36px 32px;
}

.header-section {
  text-align: center;
  margin-bottom: 24px;
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
  margin: 0 auto 16px auto;
  letter-spacing: 1px;
}

.title {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--navy);
  margin-bottom: 6px;
}

.subtitle {
  font-size: 0.86rem;
  color: var(--muted);
  line-height: 1.4;
}

.loading-state {
  text-align: center;
  padding: 32px 0;
  color: var(--muted);
  font-size: 0.9rem;
}

.invitee-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 20px;
}

.invitee-meta {
  display: flex;
  flex-direction: column;
}

.invitee-name {
  font-weight: 700;
  color: var(--ink);
  font-size: 0.95rem;
}

.invitee-email {
  font-size: 0.8rem;
  color: var(--muted);
}

.role-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  background: #dbeafe;
  color: #1e40af;
}

.alert-box {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.84rem;
  line-height: 1.45;
  margin-bottom: 16px;
}

.alert-box.error {
  background: #fef2f2;
  border: 1px solid #fca5a5;
  color: #991b1b;
}

.alert-icon {
  flex-shrink: 0;
  margin-top: 1px;
}

.section-desc {
  font-size: 0.84rem;
  color: var(--ink);
  line-height: 1.45;
  margin-bottom: 14px;
  text-align: center;
}

.btn-google {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  padding: 12px 18px;
  background: #ffffff;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
}

.btn-google:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.12);
}

.toggle-wrap {
  text-align: center;
  margin-top: 20px;
  margin-bottom: 12px;
}

.toggle-manual-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  font-size: 0.78rem;
  color: var(--muted);
  cursor: pointer;
  padding: 4px 8px;
}

.toggle-manual-btn:hover {
  color: var(--navy);
  text-decoration: underline;
}

.manual-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  margin-top: 12px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-label {
  font-size: 0.8rem;
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
  left: 10px;
  color: var(--muted);
  pointer-events: none;
}

.form-input {
  width: 100%;
  padding: 8px 12px 8px 32px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 0.88rem;
  background: white;
}

.toggle-pw {
  position: absolute;
  right: 8px;
  background: transparent;
  border: none;
  color: var(--muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px;
}

.password-checklist {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.76rem;
  color: var(--muted);
}

.check-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.check-item .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #cbd5e1;
}

.check-item.is-met {
  color: #16a34a;
  font-weight: 600;
}

.check-item.is-met .dot {
  background: #16a34a;
}

.submit-btn {
  width: 100%;
  padding: 10px;
  justify-content: center;
  font-size: 0.88rem;
  font-weight: 600;
  margin-top: 6px;
}

.success-banner {
  text-align: center;
  padding: 24px 0;
  color: #16a34a;
}

.success-icon {
  margin: 0 auto 12px;
}

.footer-link {
  text-align: center;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.link-btn {
  font-size: 0.82rem;
  color: var(--muted);
  text-decoration: none;
}

.link-btn:hover {
  color: var(--navy);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
