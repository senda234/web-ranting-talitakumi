<script setup lang="ts">
import Header from '@/components/shared/Header.vue';
import BottomNav from '@/components/shared/BottomNav.vue';
import Footer from '@/components/shared/Footer.vue';
</script>

<template>
  <div class="public-layout">
    <Header />
    <main class="public-main" id="main-content">
      <router-view />
    </main>
    <Footer />
    <BottomNav />
  </div>
</template>

<style scoped>
.public-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.public-main {
  flex: 1;
}
</style>

