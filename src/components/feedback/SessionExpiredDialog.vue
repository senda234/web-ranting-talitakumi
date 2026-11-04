<script setup lang="ts">
import { useRouter } from 'vue-router';
import { Lock, LogIn } from 'lucide-vue-next';

defineProps<{
  isOpen: boolean;
}>();

const router = useRouter();

function handleReLogin() {
  localStorage.removeItem('talitakumi_admin_auth');
  router.push('/admin/login');
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-backdrop" role="presentation">
        <div
          class="dialog-panel"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="session-expired-title"
        >
          <div class="dialog-icon-wrap" aria-hidden="true">
            <Lock :size="24" />
          </div>

          <h3 id="session-expired-title" class="dialog-title">Sesi Anda Telah Berakhir</h3>
          <p class="dialog-desc">
            Untuk menjaga keamanan akun dan integritas data ranting, silakan masuk kembali ke portal pengurus.
          </p>

          <div class="dialog-actions">
            <button
              type="button"
              class="btn btn-primary full-width"
              @click="handleReLogin"
            >
              <LogIn :size="16" />
              <span>Masuk Kembali</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(16, 33, 63, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 100000;
}

.dialog-panel {
  width: 100%;
  max-width: 400px;
  background: var(--white);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  padding: 28px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.dialog-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background-color: #fee2e2;
  color: var(--status-error);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.dialog-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--ink);
  margin-bottom: 8px;
}

.dialog-desc {
  font-size: 0.875rem;
  color: var(--muted);
  line-height: 1.5;
  margin-bottom: 24px;
}

.dialog-actions {
  width: 100%;
}

.full-width {
  width: 100%;
}

.modal-enter-active {
  transition: opacity 180ms ease;
}
.modal-enter-active .dialog-panel {
  transition: transform var(--duration-moderate) var(--motion-in),
              opacity var(--duration-moderate) var(--motion-in);
}
.modal-leave-active {
  transition: opacity 160ms var(--motion-out);
}
.modal-enter-from {
  opacity: 0;
}
.modal-enter-from .dialog-panel {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}
.modal-leave-to {
  opacity: 0;
}
</style>

