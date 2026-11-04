<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { Home } from 'lucide-vue-next';
</script>

<template>
  <div class="container not-found-view">
    <div class="card not-found-card">
      <div class="code">404</div>
      <h1 class="title">Halaman Tidak Ditemukan</h1>
      <p class="subtitle">
        Halaman yang Anda tuju tidak ditemukan atau alamat URL mungkin telah berpindah.
      </p>
      <div class="actions">
        <RouterLink to="/" class="btn btn-primary">
          <Home :size="18" aria-hidden="true" />
          <span>Kembali ke Beranda</span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found-view {
  padding: var(--space-16) var(--space-4);
  display: flex;
  align-items: center;
  justify-content: center;
}

.not-found-card {
  text-align: center;
  max-width: 540px;
  width: 100%;
  padding: var(--space-10) var(--space-6);
}

.code {
  font-family: var(--font-heading);
  font-size: 5rem;
  font-weight: 700;
  color: var(--teal);
  line-height: 1;
  margin-bottom: var(--space-2);
}

.title {
  font-size: 1.75rem;
  margin-bottom: var(--space-2);
}

.subtitle {
  color: var(--muted);
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: var(--space-6);
}

.actions {
  display: flex;
  justify-content: center;
}
</style>

