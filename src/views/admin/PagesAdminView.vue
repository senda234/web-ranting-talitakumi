<script setup lang="ts">
import { ref } from 'vue';
import { useContentStore } from '@/stores/content';
import { Save, Check, FileText, BookOpen } from 'lucide-vue-next';

const contentStore = useContentStore();
const activeTab = ref<'home' | 'history'>('home');
const isSaved = ref(false);

// Form Beranda
const slogan = ref(contentStore.settings.slogan);
const verse = ref(contentStore.settings.verse);
const subSlogan = ref(contentStore.homeData.hero.subSlogan);
const address = ref(contentStore.settings.address);
const instagram = ref(contentStore.settings.instagramHandle);

// Form Sejarah
const historyTitle = ref(contentStore.historyData.title);
const historySummary = ref(contentStore.historyData.summary);
const historyMeaning = ref(contentStore.historyData.meaning);
const youtubeUrl = ref(contentStore.historyData.youtubeUrl || '');

function handleSave() {
  // Update store & localStorage
  contentStore.saveSettings({
    slogan: slogan.value.trim(),
    verse: verse.value.trim(),
    address: address.value.trim(),
    instagramHandle: instagram.value.trim(),
    instagramUrl: `https://instagram.com/${instagram.value.trim()}`,
  });

  contentStore.saveHomeData({
    ...contentStore.homeData,
    hero: {
      ...contentStore.homeData.hero,
      slogan: slogan.value.trim(),
      subSlogan: subSlogan.value.trim(),
      verse: verse.value.trim(),
    },
  });

  contentStore.saveHistoryData({
    ...contentStore.historyData,
    title: historyTitle.value.trim(),
    summary: historySummary.value.trim(),
    meaning: historyMeaning.value.trim(),
    youtubeUrl: youtubeUrl.value.trim(),
  });

  isSaved.value = true;
  setTimeout(() => {
    isSaved.value = false;
  }, 2500);
}
</script>

<template>
  <div class="pages-admin">
    <div class="admin-page-header">
      <div>
        <h1 class="page-title">Pengelolaan Teks Halaman</h1>
        <p class="page-desc">Sesuaikan konten teks utama untuk Beranda dan Sejarah.</p>
      </div>
      <button type="button" class="btn btn-primary" @click="handleSave">
        <Check v-if="isSaved" :size="18" />
        <Save v-else :size="18" />
        <span>{{ isSaved ? 'Perubahan Tersimpan!' : 'Simpan Perubahan' }}</span>
      </button>
    </div>

    <!-- TABS NAVIGATION -->
    <div class="tabs-nav card">
      <button type="button" class="tab-btn" :class="{ 'is-active': activeTab === 'home' }" @click="activeTab = 'home'">
        <FileText :size="18" />
        <span>Halaman Beranda</span>
      </button>
      <button type="button" class="tab-btn" :class="{ 'is-active': activeTab === 'history' }"
        @click="activeTab = 'history'">
        <BookOpen :size="18" />
        <span>Halaman Sejarah</span>
      </button>
    </div>

    <!-- TAB BERANDA -->
    <section v-if="activeTab === 'home'" class="tab-pane card">
      <h2 class="pane-title">Teks Halaman Beranda</h2>
      <div class="form-grid">
        <div class="form-group full-width">
          <label class="form-label">Slogan Utama Ranting</label>
          <input v-model="slogan" type="text" class="form-input" />
        </div>

        <div class="form-group">
          <label class="form-label">Ayat Alkitab Acuan</label>
          <input v-model="verse" type="text" class="form-input" placeholder="Markus 5:41" />
        </div>

        <div class="form-group">
          <label class="form-label">Akun Instagram Resmi</label>
          <input v-model="instagram" type="text" class="form-input" placeholder="ranting.talitakumi" />
        </div>

        <div class="form-group full-width">
          <label class="form-label">Pengantar Hero Beranda</label>
          <textarea v-model="subSlogan" rows="3" class="form-input"></textarea>
        </div>

        <div class="form-group full-width">
          <label class="form-label">Alamat Sekretariat Lengkap</label>
          <input v-model="address" type="text" class="form-input" />
        </div>
      </div>
    </section>

    <!-- TAB SEJARAH -->
    <section v-if="activeTab === 'history'" class="tab-pane card">
      <h2 class="pane-title">Teks Halaman Sejarah</h2>
      <div class="form-grid">
        <div class="form-group full-width">
          <label class="form-label">Judul Utama Halaman Sejarah</label>
          <input v-model="historyTitle" type="text" class="form-input" />
        </div>

        <div class="form-group full-width">
          <label class="form-label">Ringkasan Pengantar Sejarah</label>
          <textarea v-model="historySummary" rows="2" class="form-input"></textarea>
        </div>

        <div class="form-group full-width">
          <label class="form-label">Penjelasan Makna Talitakumi</label>
          <textarea v-model="historyMeaning" rows="3" class="form-input"></textarea>
        </div>

        <div class="form-group full-width">
          <label class="form-label">URL Embed Video Dokumentasi YouTube</label>
          <input v-model="youtubeUrl" type="url" placeholder="https://www.youtube.com/embed/..." class="form-input" />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.pages-admin {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.admin-page-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

@media (min-width: 680px) {
  .admin-page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.page-title {
  font-size: 1.75rem;
  margin: 0;
}

.page-desc {
  color: var(--muted);
  font-size: 0.92rem;
  margin-top: 2px;
}

.tabs-nav {
  display: flex;
  gap: var(--space-2);
  padding: 6px;
  width: fit-content;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--muted);
  transition: all 0.2s ease;
}

.tab-btn:hover {
  color: var(--ink);
  background: #f1f5f9;
}

.tab-btn.is-active {
  background: var(--navy);
  color: var(--gold);
  font-weight: 600;
}

.tab-pane {
  padding: var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.pane-title {
  font-size: 1.35rem;
  margin: 0;
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

@media (min-width: 680px) {
  .form-grid {
    grid-template-columns: 1fr 1fr;
  }

  .full-width {
    grid-column: span 2;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 0.85rem;
  font-weight: 600;
}

.form-input {
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.95rem;
}
</style>
