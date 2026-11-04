<script setup lang="ts">
import { AlertTriangle, RotateCcw } from 'lucide-vue-next';

withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    referenceCode?: string;
    canRetry?: boolean;
    retryLabel?: string;
  }>(),
  {
    title: 'Terjadi masalah saat memproses permintaan',
    description: 'Data yang Anda isi tetap dipertahankan. Silakan coba kembali atau muat ulang halaman.',
    canRetry: true,
    retryLabel: 'Coba Lagi',
  }
);

defineEmits<{
  (e: 'retry'): void;
}>();
</script>

<template>
  <div class="error-state" role="alert">
    <div class="error-icon-wrap" aria-hidden="true">
      <AlertTriangle :size="36" class="error-icon" />
    </div>

    <h3 class="error-title">{{ title }}</h3>
    <p class="error-desc">{{ description }}</p>

    <div v-if="referenceCode" class="reference-code-badge">
      Kode referensi: <code>{{ referenceCode }}</code>
    </div>

    <div v-if="canRetry" class="error-actions">
      <button type="button" class="btn btn-primary" @click="$emit('retry')">
        <RotateCcw :size="16" />
        <span>{{ retryLabel }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 24px;
  background-color: var(--status-error-bg);
  border: 1px solid var(--status-error-border);
  border-radius: var(--radius);
  animation: fadeIn var(--duration-normal) var(--motion-in);
}

.error-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: #fee2e2;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.error-icon {
  color: var(--status-error);
}

.error-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #7f1d1d;
  margin-bottom: 8px;
}

.error-desc {
  font-size: 0.875rem;
  color: #991b1b;
  max-width: 440px;
  line-height: 1.5;
  margin-bottom: 16px;
}

.reference-code-badge {
  font-size: 0.75rem;
  color: #7f1d1d;
  background-color: #fecaca;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  margin-bottom: 20px;
}

.reference-code-badge code {
  font-weight: 700;
}

.error-actions {
  display: flex;
  gap: 12px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .error-state {
    animation: none;
  }
}
</style>

