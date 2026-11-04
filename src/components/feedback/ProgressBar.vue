<script setup lang="ts">
import { computed } from 'vue';
import { Check, AlertCircle } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    value?: number; // 0 to 100
    indeterminate?: boolean;
    statusText?: string;
    isFailed?: boolean;
    errorMessage?: string;
    showPercentage?: boolean;
  }>(),
  {
    value: 0,
    indeterminate: false,
    isFailed: false,
    showPercentage: true,
  }
);

const emit = defineEmits<{
  (e: 'retry'): void;
}>();

const clampedValue = computed(() => Math.min(100, Math.max(0, props.value)));
const isComplete = computed(() => !props.indeterminate && !props.isFailed && clampedValue.value >= 100);
</script>

<template>
  <div class="progress-wrapper">
    <div v-if="statusText || showPercentage" class="progress-meta">
      <span class="status-label" :class="{ 'error-text': isFailed }">
        {{ isFailed ? errorMessage || 'Gagal memproses' : statusText }}
      </span>
      <span v-if="!indeterminate && showPercentage && !isFailed" class="percent-label">
        <span v-if="isComplete" class="complete-badge">
          <Check :size="14" /> Selesai
        </span>
        <span v-else>{{ clampedValue }}%</span>
      </span>
      <button
        v-if="isFailed"
        type="button"
        class="retry-btn"
        @click="emit('retry')"
      >
        Coba Lagi
      </button>
    </div>

    <div
      class="progress-track"
      role="progressbar"
      :aria-valuenow="indeterminate ? undefined : clampedValue"
      :aria-valuemin="0"
      :aria-valuemax="100"
    >
      <div
        v-if="indeterminate"
        class="progress-bar is-indeterminate"
      ></div>
      <div
        v-else
        class="progress-bar"
        :class="{ 'bar-complete': isComplete, 'bar-failed': isFailed }"
        :style="{ width: `${clampedValue}%` }"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.progress-wrapper {
  width: 100%;
}

.progress-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 0.8125rem;
}

.status-label {
  color: var(--muted);
  font-weight: 500;
}

.status-label.error-text {
  color: var(--status-error);
}

.percent-label {
  font-weight: 600;
  color: var(--ink);
}

.complete-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--status-success);
}

.retry-btn {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--blue);
  background: none;
  border: none;
  padding: 0;
  min-height: auto;
  min-width: auto;
  text-decoration: underline;
  cursor: pointer;
}

.progress-track {
  width: 100%;
  height: 6px;
  background-color: #e2e8f0;
  border-radius: var(--radius-full);
  overflow: hidden;
  position: relative;
}

.progress-bar {
  height: 100%;
  background-color: var(--blue);
  border-radius: var(--radius-full);
  transition: width var(--duration-normal) var(--motion-standard),
              background-color var(--duration-fast);
}

.progress-bar.bar-complete {
  background-color: var(--status-success);
}

.progress-bar.bar-failed {
  background-color: var(--status-error);
}

.progress-bar.is-indeterminate {
  width: 40%;
  position: absolute;
  animation: indeterminate 1.4s infinite ease-in-out;
}

@keyframes indeterminate {
  0% { left: -40%; }
  100% { left: 100%; }
}

@media (prefers-reduced-motion: reduce) {
  .progress-bar {
    transition: none !important;
  }
  .progress-bar.is-indeterminate {
    animation: none;
    left: 30%;
  }
}
</style>

