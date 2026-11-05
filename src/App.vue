<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterView } from 'vue-router';
import ToastViewport from '@/components/feedback/ToastViewport.vue';
import PageBanner from '@/components/feedback/PageBanner.vue';
import AppLoadingOverlay from '@/components/feedback/AppLoadingOverlay.vue';
import { useLoadingStore } from '@/stores/loading';

const loadingStore = useLoadingStore();

onMounted(() => {
  // Matikan loading awal web setelah halaman siap dimuat
  setTimeout(() => {
    loadingStore.forceHide();
  }, 350);
});
</script>

<template>
  <div class="app-root">
    <AppLoadingOverlay />
    <PageBanner />
    <ToastViewport />
    <RouterView />
  </div>
</template>

<style scoped>
.app-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
