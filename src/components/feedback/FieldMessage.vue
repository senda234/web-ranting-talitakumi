<script setup lang="ts">
import { AlertCircle, CheckCircle2 } from 'lucide-vue-next';

defineProps<{
  error?: string | null;
  success?: string | null;
  hint?: string | null;
  id?: string;
}>();
</script>

<template>
  <Transition name="field-msg">
    <div
      v-if="error"
      :id="id"
      class="field-message error-msg"
      role="alert"
    >
      <AlertCircle :size="14" class="msg-icon" aria-hidden="true" />
      <span>{{ error }}</span>
    </div>
    <div
      v-else-if="success"
      :id="id"
      class="field-message success-msg"
    >
      <CheckCircle2 :size="14" class="msg-icon" aria-hidden="true" />
      <span>{{ success }}</span>
    </div>
    <div
      v-else-if="hint"
      :id="id"
      class="field-message hint-msg"
    >
      <span>{{ hint }}</span>
    </div>
  </Transition>
</template>

<style scoped>
.field-message {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 0.8125rem;
  line-height: 1.35;
}

.msg-icon {
  flex-shrink: 0;
}

.error-msg {
  color: var(--status-error);
}

.success-msg {
  color: var(--status-success);
}

.hint-msg {
  color: var(--muted);
}

/* Animations adhering to §10.3 */
.field-msg-enter-active {
  transition: opacity 180ms var(--motion-in),
              transform 180ms var(--motion-in);
}

.field-msg-leave-active {
  transition: opacity 120ms var(--motion-out);
}

.field-msg-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}

.field-msg-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .field-msg-enter-active,
  .field-msg-leave-active {
    transition: opacity 1ms !important;
  }
  .field-msg-enter-from {
    transform: none !important;
  }
}
</style>

