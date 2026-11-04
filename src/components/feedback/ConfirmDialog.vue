<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { AlertTriangle, Info, X } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'primary' | 'warning';
    isLoading?: boolean;
  }>(),
  {
    confirmLabel: 'Konfirmasi',
    cancelLabel: 'Batal',
    variant: 'primary',
    isLoading: false,
  }
);

const emit = defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

const confirmBtnRef = ref<HTMLButtonElement | null>(null);

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.isOpen && !props.isLoading) {
    emit('cancel');
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      setTimeout(() => {
        confirmBtnRef.value?.focus();
      }, 50);
    }
  }
);

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="modal-backdrop"
        role="presentation"
        @click.self="!isLoading && emit('cancel')"
      >
        <div
          class="dialog-panel"
          role="alertdialog"
          aria-modal="true"
          :aria-labelledby="`${title}-dialog`"
        >
          <div class="dialog-header">
            <div
              class="dialog-icon-wrap"
              :class="`icon-${variant}`"
              aria-hidden="true"
            >
              <AlertTriangle v-if="variant === 'danger' || variant === 'warning'" :size="20" />
              <Info v-else :size="20" />
            </div>
            <h3 :id="`${title}-dialog`" class="dialog-title">{{ title }}</h3>
            <button
              v-if="!isLoading"
              type="button"
              class="close-btn"
              aria-label="Tutup dialog"
              @click="emit('cancel')"
            >
              <X :size="18" />
            </button>
          </div>

          <div class="dialog-body">
            <p>{{ message }}</p>
            <slot />
          </div>

          <div class="dialog-actions">
            <button
              type="button"
              class="btn btn-outline"
              :disabled="isLoading"
              @click="emit('cancel')"
            >
              {{ cancelLabel }}
            </button>
            <button
              ref="confirmBtnRef"
              type="button"
              class="btn"
              :class="variant === 'danger' ? 'btn-danger' : 'btn-primary'"
              :disabled="isLoading"
              @click="emit('confirm')"
            >
              <span v-if="isLoading">Memproses...</span>
              <span v-else>{{ confirmLabel }}</span>
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
  background-color: rgba(16, 33, 63, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 99999;
}

.dialog-panel {
  width: 100%;
  max-width: 460px;
  background: var(--white);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.dialog-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-danger {
  background-color: #fee2e2;
  color: var(--status-error);
}

.icon-warning {
  background-color: #fef3c7;
  color: var(--status-warning);
}

.icon-primary {
  background-color: #dbeafe;
  color: var(--status-info);
}

.dialog-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--ink);
  flex: 1;
  margin: 0;
}

.close-btn {
  color: var(--muted);
  border: none;
  background: none;
  cursor: pointer;
  padding: 4px;
  min-height: 32px;
  min-width: 32px;
  border-radius: var(--radius-sm);
}

.close-btn:hover {
  background-color: var(--status-neutral-bg);
  color: var(--ink);
}

.dialog-body {
  font-size: 0.875rem;
  color: var(--muted);
  line-height: 1.5;
}

.dialog-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

.btn-danger {
  background-color: var(--status-error);
  color: var(--white);
}

.btn-danger:hover {
  background-color: #991b1b;
}

.btn-outline {
  border: 1px solid var(--border);
  color: var(--ink);
  background-color: transparent;
}

.btn-outline:hover {
  background-color: var(--status-neutral-bg);
}

/* Animations adhering to §12.2 & §12.3 */
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

.modal-leave-active .dialog-panel {
  transition: transform 160ms var(--motion-out),
              opacity 160ms var(--motion-out);
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

.modal-leave-to .dialog-panel {
  opacity: 0;
  transform: translateY(6px) scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .modal-enter-active,
  .modal-leave-active,
  .modal-enter-active .dialog-panel,
  .modal-leave-active .dialog-panel {
    transition: opacity 1ms !important;
  }
  .modal-enter-from .dialog-panel,
  .modal-leave-to .dialog-panel {
    transform: none !important;
  }
}
</style>

