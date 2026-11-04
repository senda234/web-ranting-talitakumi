<script setup lang="ts">
import { useNotificationStore } from '@/stores/notifications';
import AppToast from './AppToast.vue';

const notificationStore = useNotificationStore();

function handleDismiss(id: string) {
  notificationStore.removeToast(id);
}
</script>

<template>
  <div class="toast-viewport" aria-live="polite">
    <TransitionGroup name="toast">
      <AppToast
        v-for="toast in notificationStore.toasts"
        :key="toast.id"
        :toast="toast"
        @dismiss="handleDismiss"
      />
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-viewport {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
  width: calc(100vw - 32px);
  max-width: 380px;
}

@media (min-width: 768px) {
  .toast-viewport {
    top: 24px;
    right: 24px;
  }
}

/* Animations adhering to §8.4 & §8.5 */
.toast-enter-active {
  transition: opacity var(--duration-normal) var(--motion-in),
              transform var(--duration-normal) var(--motion-in);
}

.toast-leave-active {
  transition: opacity var(--duration-fast) var(--motion-out),
              transform var(--duration-fast) var(--motion-out);
  position: absolute;
  width: 100%;
}

.toast-move {
  transition: transform var(--duration-normal) var(--motion-standard);
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-8px) translateX(12px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 640px) {
  .toast-enter-from {
    transform: translateY(-8px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active,
  .toast-move {
    transition: opacity 1ms !important;
  }
  .toast-enter-from,
  .toast-leave-to {
    transform: none !important;
  }
}
</style>

