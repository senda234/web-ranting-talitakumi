<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'text' | 'title' | 'avatar' | 'image' | 'card';
    width?: string;
    height?: string;
    count?: number;
  }>(),
  {
    variant: 'text',
    count: 1,
  }
);
</script>

<template>
  <div class="skeleton-group" aria-hidden="true">
    <div
      v-for="n in count"
      :key="n"
      class="skeleton-item"
      :class="`skeleton-${variant}`"
      :style="{ width, height }"
    ></div>
  </div>
</template>

<style scoped>
.skeleton-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.skeleton-item {
  background: linear-gradient(
    90deg,
    #f1f5f9 25%,
    #e2e8f0 50%,
    #f1f5f9 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
  border-radius: var(--radius-sm);
}

.skeleton-text {
  height: 14px;
  width: 100%;
  border-radius: 4px;
}

.skeleton-title {
  height: 24px;
  width: 60%;
  border-radius: 6px;
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.skeleton-image {
  width: 100%;
  height: 200px;
  border-radius: var(--radius);
}

.skeleton-card {
  width: 100%;
  height: 120px;
  border-radius: var(--radius);
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-item {
    animation: none;
    background: #e2e8f0;
  }
}
</style>

