<script setup lang="ts">
import { computed } from 'vue';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  X,
  FileImage,
} from 'lucide-vue-next';
import ProgressBar from './ProgressBar.vue';

export type UploadItemStatus =
  | 'QUEUED'
  | 'VALIDATING'
  | 'UPLOADING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED';

export interface UploadItem {
  id: string;
  name: string;
  size: number;
  previewUrl?: string;
  progress: number;
  status: UploadItemStatus;
  errorMessage?: string;
}

const props = defineProps<{
  item: UploadItem;
}>();

const emit = defineEmits<{
  (e: 'retry', id: string): void;
  (e: 'remove', id: string): void;
}>();

const formattedSize = computed(() => {
  const bytes = props.item.size;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
});

const statusLabel = computed(() => {
  switch (props.item.status) {
    case 'QUEUED':
      return 'Menunggu antrean...';
    case 'VALIDATING':
      return 'Memvalidasi format...';
    case 'UPLOADING':
      return `Mengunggah (${props.item.progress}%)`;
    case 'PROCESSING':
      return 'Menyimpan metadata...';
    case 'SUCCESS':
      return 'Selesai diunggah';
    case 'FAILED':
      return props.item.errorMessage || 'Gagal diunggah';
    case 'CANCELLED':
      return 'Dibatalkan';
    default:
      return '';
  }
});
</script>

<template>
  <div class="upload-status-card" :class="`status-${item.status.toLowerCase()}`">
    <!-- Thumbnail Preview -->
    <div class="thumb-wrap">
      <img
        v-if="item.previewUrl"
        :src="item.previewUrl"
        :alt="item.name"
        class="thumb-img"
      />
      <FileImage v-else :size="24" class="thumb-placeholder" />
    </div>

    <!-- Details & Progress -->
    <div class="details-wrap">
      <div class="file-info">
        <span class="file-name" :title="item.name">{{ item.name }}</span>
        <span class="file-size">{{ formattedSize }}</span>
      </div>

      <div class="progress-section">
        <ProgressBar
          :value="item.progress"
          :indeterminate="item.status === 'PROCESSING' || item.status === 'VALIDATING'"
          :status-text="statusLabel"
          :is-failed="item.status === 'FAILED'"
          :error-message="item.errorMessage"
          @retry="emit('retry', item.id)"
        />
      </div>
    </div>

    <!-- Quick Actions / Icon -->
    <div class="action-wrap">
      <CheckCircle2
        v-if="item.status === 'SUCCESS'"
        :size="20"
        class="icon-success"
        aria-label="Upload berhasil"
      />
      <button
        v-else-if="item.status === 'FAILED'"
        type="button"
        class="icon-btn retry-icon"
        title="Coba unggah ulang"
        aria-label="Coba unggah ulang"
        @click="emit('retry', item.id)"
      >
        <RotateCcw :size="16" />
      </button>
      <Clock
        v-else-if="item.status === 'QUEUED'"
        :size="18"
        class="icon-queued"
        aria-label="Menunggu antrean"
      />

      <button
        type="button"
        class="icon-btn remove-icon"
        title="Hapus dari daftar"
        aria-label="Hapus dari daftar"
        @click="emit('remove', item.id)"
      >
        <X :size="16" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.upload-status-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background-color: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  transition: opacity var(--duration-fast), transform var(--duration-fast);
}

.thumb-wrap {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background-color: var(--status-neutral-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-placeholder {
  color: var(--muted);
}

.details-wrap {
  flex: 1;
  min-width: 0;
}

.file-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.file-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 0.75rem;
  color: var(--muted);
  flex-shrink: 0;
}

.progress-section {
  width: 100%;
}

.action-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.icon-btn {
  padding: 4px;
  min-height: 28px;
  min-width: 28px;
  border-radius: var(--radius-sm);
  border: none;
  background: none;
  cursor: pointer;
  color: var(--muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background-color: var(--status-neutral-bg);
  color: var(--ink);
}

.icon-success {
  color: var(--status-success);
}

.icon-queued {
  color: var(--muted);
}

.retry-icon {
  color: var(--blue);
}

.remove-icon:hover {
  color: var(--status-error);
}
</style>

