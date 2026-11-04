<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import type { ToastMessage } from '@/stores/notifications';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-vue-next';

const props = defineProps<{
  toast: ToastMessage;
}>();

const emit = defineEmits<{
  (e: 'dismiss', id: string): void;
}>();

let timer: any = null;
let remaining = props.toast.duration || 0;
let startTime = 0;
const isHovered = ref(false);

function startTimer() {
  if (!props.toast.duration) return;
  startTime = Date.now();
  timer = setTimeout(() => {
    emit('dismiss', props.toast.id);
  }, remaining);
}

function pauseTimer() {
  if (!props.toast.duration || !timer) return;
  isHovered.value = true;
  clearTimeout(timer);
  timer = null;
  const elapsed = Date.now() - startTime;
  remaining = Math.max(1000, remaining - elapsed);
}

function resumeTimer() {
  if (!props.toast.duration) return;
  isHovered.value = false;
  startTimer();
}

function handleClose() {
  if (timer) clearTimeout(timer);
  emit('dismiss', props.toast.id);
}

function handleAction() {
  if (props.toast.action) {
    props.toast.action();
  }
  handleClose();
}

onMounted(() => {
  startTimer();
});

onUnmounted(() => {
  if (timer) clearTimeout(timer);
});
</script>

<template>
  <div
    class="app-toast"
    :class="`toast-${toast.type}`"
    :role="toast.type === 'error' ? 'alert' : 'status'"
    :aria-live="toast.type === 'error' ? 'assertive' : 'polite'"
    @mouseenter="pauseTimer"
    @mouseleave="resumeTimer"
    @focusin="pauseTimer"
    @focusout="resumeTimer"
  >
    <div class="toast-icon-wrap" aria-hidden="true">
      <CheckCircle2 v-if="toast.type === 'success'" :size="20" class="toast-icon icon-success" />
      <AlertCircle v-else-if="toast.type === 'error'" :size="20" class="toast-icon icon-error" />
      <AlertTriangle v-else-if="toast.type === 'warning'" :size="20" class="toast-icon icon-warning" />
      <Info v-else :size="20" class="toast-icon icon-info" />
    </div>

    <div class="toast-body">
      <div class="toast-title">{{ toast.title }}</div>
      <p v-if="toast.description" class="toast-desc">{{ toast.description }}</p>
      <button
        v-if="toast.actionLabel"
        type="button"
        class="toast-action-btn"
        @click="handleAction"
      >
        {{ toast.actionLabel }}
      </button>
    </div>

    <button
      type="button"
      class="toast-close-btn"
      title="Tutup pemberitahuan"
      aria-label="Tutup pemberitahuan"
      @click="handleClose"
    >
      <X :size="16" />
    </button>
  </div>
</template>

<style scoped>
.app-toast {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  max-width: 380px;
  padding: 14px 16px;
  background: var(--white);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  box-shadow: 0 8px 24px rgba(16, 33, 63, 0.12);
  pointer-events: auto;
  position: relative;
  transition: transform var(--duration-fast) var(--motion-standard),
              box-shadow var(--duration-fast) var(--motion-standard);
}

.app-toast:hover {
  box-shadow: 0 12px 28px rgba(16, 33, 63, 0.16);
}

/* Status variants */
.toast-success {
  border-left: 4px solid var(--status-success);
}
.toast-error {
  border-left: 4px solid var(--status-error);
}
.toast-warning {
  border-left: 4px solid var(--status-warning);
}
.toast-info {
  border-left: 4px solid var(--status-info);
}

.toast-icon-wrap {
  flex-shrink: 0;
  margin-top: 1px;
}

.icon-success { color: var(--status-success); }
.icon-error { color: var(--status-error); }
.icon-warning { color: var(--status-warning); }
.icon-info { color: var(--status-info); }

.toast-body {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--ink);
  line-height: 1.35;
}

.toast-desc {
  font-size: 0.8125rem;
  color: var(--muted);
  margin-top: 4px;
  line-height: 1.4;
  word-break: break-word;
}

.toast-action-btn {
  margin-top: 8px;
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

.toast-action-btn:hover {
  color: var(--navy-dark);
}

.toast-close-btn {
  flex-shrink: 0;
  min-height: 28px;
  min-width: 28px;
  padding: 4px;
  margin-top: -2px;
  margin-right: -6px;
  border-radius: var(--radius-sm);
  color: var(--muted);
  background: none;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background-color var(--duration-fast), color var(--duration-fast);
}

.toast-close-btn:hover {
  background-color: var(--status-neutral-bg);
  color: var(--ink);
}
</style>

