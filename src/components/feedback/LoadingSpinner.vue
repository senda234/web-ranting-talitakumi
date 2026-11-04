<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    inline?: boolean;
    color?: string;
  }>(),
  {
    size: 'md',
    inline: false,
  }
);
</script>

<template>
  <div class="spinner-container" :class="[{ 'is-inline': inline }, `size-${size}`]" role="status">
    <div
      class="spinner-ring"
      :style="color ? { borderTopColor: color, borderRightColor: color } : {}"
      aria-hidden="true"
    ></div>
    <span v-if="text" class="spinner-text">{{ text }}</span>
    <span class="sr-only">{{ text || 'Sedang memproses...' }}</span>
  </div>
</template>

<style scoped>
.spinner-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.spinner-container.is-inline {
  display: inline-flex;
}

.spinner-ring {
  border-radius: 50%;
  border: 2px solid rgba(16, 33, 63, 0.12);
  border-top-color: var(--blue);
  border-right-color: var(--blue);
  animation: spin 0.9s linear infinite;
}

/* Sizes adhering to §13.2 */
.size-sm .spinner-ring {
  width: 16px;
  height: 16px;
  border-width: 2px;
}

.size-md .spinner-ring {
  width: 26px;
  height: 26px;
  border-width: 2.5px;
}

.size-lg .spinner-ring {
  width: 40px;
  height: 40px;
  border-width: 3.5px;
}

.spinner-text {
  font-size: 0.875rem;
  color: var(--muted);
  font-weight: 500;
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

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .spinner-ring {
    animation-duration: 2.5s;
  }
}
</style>

