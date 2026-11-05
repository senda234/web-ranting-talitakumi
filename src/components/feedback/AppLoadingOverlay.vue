<script setup lang="ts">
import { useLoadingStore } from '@/stores/loading';

const loadingStore = useLoadingStore();
</script>

<template>
  <Transition name="loading-fade">
    <div
      v-if="loadingStore.isLoading"
      class="loading-overlay"
      role="status"
      aria-live="polite"
      aria-label="Sedang memuat..."
    >
      <div class="spinner-circle" aria-hidden="true"></div>
      <span class="sr-only">Sedang memuat...</span>
    </div>
  </Transition>
</template>

<style scoped>
.loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 999998;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(100px);
  -webkit-backdrop-filter: blur(100px);
  pointer-events: all;
  user-select: none;
}

.spinner-circle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 4px solid rgba(2, 132, 199, 0.15);
  border-top-color: #0284c7;
  border-right-color: #0284c7;
  animation: spin-circle 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

@keyframes spin-circle {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-fade-enter-active,
.loading-fade-leave-active {
  transition: opacity 0.3s ease, backdrop-filter 0.3s ease;
}

.loading-fade-enter-from,
.loading-fade-leave-to {
  opacity: 0;
  backdrop-filter: blur(0px);
  -webkit-backdrop-filter: blur(0px);
}

@media (prefers-reduced-motion: reduce) {
  .spinner-circle {
    animation-duration: 2s;
  }
  .loading-fade-enter-active,
  .loading-fade-leave-active {
    transition: opacity 1ms !important;
  }
}
</style>

