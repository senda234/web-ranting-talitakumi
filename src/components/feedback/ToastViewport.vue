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
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 999999; /* Z-index tertinggi agar melayang di atas seluruh elemen, modal & banner */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  pointer-events: none;
  width: calc(100vw - 32px);
  max-width: 440px;
}

/* Animasi Muncul 0.5s, Bertahan 1s, dan Menghilang 0.5s */
.toast-enter-active {
  transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-leave-active {
  transition: opacity 0.5s cubic-bezier(0.7, 0, 0.84, 0),
              transform 0.5s cubic-bezier(0.7, 0, 0.84, 0);
  position: absolute;
  width: 100%;
}

.toast-move {
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-28px) scale(0.92);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.92);
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

