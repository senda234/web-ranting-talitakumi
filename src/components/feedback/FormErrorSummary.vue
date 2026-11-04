<script setup lang="ts">
import { ref } from 'vue';
import { AlertCircle } from 'lucide-vue-next';

export interface FormErrorItem {
  fieldId: string;
  message: string;
}

const props = defineProps<{
  errors: FormErrorItem[];
  title?: string;
}>();

const summaryRef = ref<HTMLDivElement | null>(null);

function focusField(fieldId: string) {
  const el = document.getElementById(fieldId);
  if (el) {
    el.focus();
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function focusSummary() {
  summaryRef.value?.focus();
}

defineExpose({
  focusSummary,
});
</script>

<template>
  <Transition name="fade">
    <div
      v-if="errors.length > 0"
      ref="summaryRef"
      class="form-error-summary"
      role="alert"
      tabindex="-1"
    >
      <div class="summary-head">
        <AlertCircle :size="20" class="summary-icon" aria-hidden="true" />
        <h4 class="summary-title">{{ title || 'Data belum dapat disimpan' }}</h4>
      </div>
      <p class="summary-subtitle">Periksa {{ errors.length }} bagian berikut:</p>
      <ul class="error-list">
        <li v-for="err in errors" :key="err.fieldId">
          <button
            type="button"
            class="error-link-btn"
            @click="focusField(err.fieldId)"
          >
            {{ err.message }}
          </button>
        </li>
      </ul>
    </div>
  </Transition>
</template>

<style scoped>
.form-error-summary {
  background-color: var(--status-error-bg);
  border: 1px solid var(--status-error-border);
  border-radius: var(--radius-sm);
  padding: 14px 16px;
  margin-bottom: 20px;
  color: #7f1d1d;
  outline: none;
}

.form-error-summary:focus-visible {
  box-shadow: 0 0 0 3px rgba(185, 28, 28, 0.3);
}

.summary-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-icon {
  color: var(--status-error);
  flex-shrink: 0;
}

.summary-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #7f1d1d;
  font-family: inherit;
}

.summary-subtitle {
  font-size: 0.8125rem;
  margin: 6px 0 8px 28px;
  color: #991b1b;
}

.error-list {
  list-style-type: disc;
  margin-left: 44px;
  font-size: 0.8125rem;
}

.error-link-btn {
  color: var(--status-error);
  text-decoration: underline;
  font-size: inherit;
  font-weight: 500;
  background: none;
  border: none;
  padding: 0;
  min-height: auto;
  min-width: auto;
  cursor: pointer;
  text-align: left;
}

.error-link-btn:hover {
  color: #581c1c;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--duration-normal) var(--motion-standard),
              transform var(--duration-normal) var(--motion-standard);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>

