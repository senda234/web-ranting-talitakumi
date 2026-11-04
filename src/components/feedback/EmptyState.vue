<script setup lang="ts">
import { FolderOpen, Search, Inbox } from 'lucide-vue-next';

withDefaults(
  defineProps<{
    iconType?: 'folder' | 'search' | 'inbox';
    title: string;
    description?: string;
    actionLabel?: string;
  }>(),
  {
    iconType: 'folder',
  }
);

defineEmits<{
  (e: 'action'): void;
}>();
</script>

<template>
  <div class="empty-state">
    <div class="empty-icon-wrap" aria-hidden="true">
      <FolderOpen v-if="iconType === 'folder'" :size="40" class="empty-icon" />
      <Search v-else-if="iconType === 'search'" :size="40" class="empty-icon" />
      <Inbox v-else :size="40" class="empty-icon" />
    </div>

    <h3 class="empty-title">{{ title }}</h3>
    <p v-if="description" class="empty-desc">{{ description }}</p>

    <div v-if="actionLabel" class="empty-action">
      <button type="button" class="btn btn-primary" @click="$emit('action')">
        {{ actionLabel }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 24px;
  background-color: var(--white);
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  animation: fadeIn var(--duration-normal) var(--motion-in);
}

.empty-icon-wrap {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background-color: var(--status-neutral-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.empty-icon {
  color: var(--muted);
}

.empty-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--ink);
  margin-bottom: 6px;
}

.empty-desc {
  font-size: 0.875rem;
  color: var(--muted);
  max-width: 420px;
  line-height: 1.5;
  margin-bottom: 20px;
}

.empty-action {
  margin-top: 4px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .empty-state {
    animation: none;
  }
}
</style>

