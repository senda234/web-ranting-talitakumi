<script setup lang="ts">
import { useNetworkStore } from '@/stores/network';
import { WifiOff, Wifi, AlertTriangle, Info } from 'lucide-vue-next';

withDefaults(
  defineProps<{
    type?: 'warning' | 'info' | 'error' | 'success';
    message?: string;
    autoNetwork?: boolean;
  }>(),
  {
    type: 'warning',
    autoNetwork: true,
  }
);

const networkStore = useNetworkStore();
</script>

<template>
  <div class="page-banner-container">
    <!-- Auto Offline Banner -->
    <Transition name="banner">
      <div
        v-if="autoNetwork && !networkStore.isOnline"
        class="page-banner banner-offline"
        role="alert"
      >
        <WifiOff :size="18" class="banner-icon" />
        <span>Anda sedang offline. Perubahan belum dapat dikirim ke server.</span>
      </div>
      <div
        v-else-if="autoNetwork && networkStore.showReconnectedBanner"
        class="page-banner banner-online"
        role="status"
      >
        <Wifi :size="18" class="banner-icon" />
        <span>Koneksi kembali tersedia.</span>
      </div>
      <div
        v-else-if="message"
        class="page-banner"
        :class="`banner-${type}`"
        role="region"
      >
        <AlertTriangle v-if="type === 'warning' || type === 'error'" :size="18" class="banner-icon" />
        <Info v-else :size="18" class="banner-icon" />
        <span>{{ message }}</span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.page-banner-container {
  width: 100%;
}

.page-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px 16px;
  font-size: 0.875rem;
  font-weight: 500;
  text-align: center;
}

.banner-icon {
  flex-shrink: 0;
}

.banner-offline {
  background-color: #fee2e2;
  color: #991b1b;
  border-bottom: 1px solid #fca5a5;
}

.banner-online {
  background-color: #dcfce7;
  color: #166534;
  border-bottom: 1px solid #86efac;
}

.banner-warning {
  background-color: var(--status-warning-bg);
  color: var(--status-warning);
  border-bottom: 1px solid var(--status-warning-border);
}

.banner-info {
  background-color: var(--status-info-bg);
  color: var(--status-info);
  border-bottom: 1px solid var(--status-info-border);
}

.banner-error {
  background-color: var(--status-error-bg);
  color: var(--status-error);
  border-bottom: 1px solid var(--status-error-border);
}

/* Animations adhering to §11.2 */
.banner-enter-active {
  transition: opacity var(--duration-normal) var(--motion-in),
              transform var(--duration-normal) var(--motion-in);
}

.banner-leave-active {
  transition: opacity var(--duration-fast) var(--motion-out),
              transform var(--duration-fast) var(--motion-out);
}

.banner-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.banner-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>

