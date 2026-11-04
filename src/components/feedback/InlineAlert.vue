<script setup lang="ts">
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
} from 'lucide-vue-next';

withDefaults(
  defineProps<{
    type?: 'success' | 'error' | 'warning' | 'info' | 'neutral';
    title?: string;
    message?: string;
  }>(),
  {
    type: 'info',
  }
);
</script>

<template>
  <div
    class="inline-alert"
    :class="`alert-${type}`"
    :role="type === 'error' ? 'alert' : 'region'"
  >
    <div class="alert-icon-wrap" aria-hidden="true">
      <CheckCircle2 v-if="type === 'success'" :size="18" class="icon-success" />
      <AlertCircle v-else-if="type === 'error'" :size="18" class="icon-error" />
      <AlertTriangle v-else-if="type === 'warning'" :size="18" class="icon-warning" />
      <Info v-else :size="18" class="icon-info" />
    </div>

    <div class="alert-content">
      <div v-if="title" class="alert-title">{{ title }}</div>
      <div class="alert-text">
        <slot>{{ message }}</slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.inline-alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  line-height: 1.45;
  transition: opacity var(--duration-fast) var(--motion-standard);
}

.alert-icon-wrap {
  flex-shrink: 0;
  margin-top: 1px;
}

.alert-content {
  flex: 1;
  min-width: 0;
}

.alert-title {
  font-weight: 600;
  margin-bottom: 2px;
}

/* Status variants */
.alert-success {
  background-color: var(--status-success-bg);
  border: 1px solid var(--status-success-border);
  color: #14532d;
}
.icon-success { color: var(--status-success); }

.alert-error {
  background-color: var(--status-error-bg);
  border: 1px solid var(--status-error-border);
  color: #7f1d1d;
}
.icon-error { color: var(--status-error); }

.alert-warning {
  background-color: var(--status-warning-bg);
  border: 1px solid var(--status-warning-border);
  color: #713f12;
}
.icon-warning { color: var(--status-warning); }

.alert-info {
  background-color: var(--status-info-bg);
  border: 1px solid var(--status-info-border);
  color: #1e3a8a;
}
.icon-info { color: var(--status-info); }

.alert-neutral {
  background-color: var(--status-neutral-bg);
  border: 1px solid var(--status-neutral-border);
  color: var(--status-neutral);
}
</style>

