<script setup lang="ts">
import { RouterView } from 'vue-router';
import ToastViewport from '@/components/feedback/ToastViewport.vue';
import PageBanner from '@/components/feedback/PageBanner.vue';
</script>

<template>
  <div class="app-root">
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
