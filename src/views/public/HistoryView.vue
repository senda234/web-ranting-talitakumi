<script setup lang="ts">
import { ref } from 'vue';
import { useContentStore } from '@/stores/content';
import { ChevronDown, Play, Sparkles } from 'lucide-vue-next';

const contentStore = useContentStore();
const historyData = contentStore.historyData;

// Accordion state: by default, only the latest section (index 6, sec-7) is open
const openSections = ref<Record<string, boolean>>({
  'sec-7': true,
});

function toggleSection(id: string) {
  openSections.value[id] = !openSections.value[id];
}

function handleTimelineClick(sectionId?: string) {
  if (sectionId) {
    openSections.value[sectionId] = true;
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

// Facade lazy loader for YouTube
const showVideoIframe = ref(false);
function playVideo() {
  showVideoIframe.value = true;
}
</script>

<template>
  <div class="history-view">
    <!-- Header Page -->
    <header class="page-header">
      <div class="container">
        <span class="badge badge-teal">Sejarah Pelayanan</span>
        <h1 class="page-title">{{ historyData.title }}</h1>
        <p class="section-subtitle">{{ historyData.summary }}</p>

        <!-- Meaning Box -->
        <div class="meaning-card">
          <div class="meaning-icon" aria-hidden="true">
            <Sparkles :size="24" />
          </div>
          <div class="meaning-content">
            <div class="meaning-label">Makna Nama Talitakumi (Bahasa Aram)</div>
            <div class="meaning-quote">“Talita Kum — Hai, anak muda, bangkitlah!”</div>
            <p class="meaning-verse">Berdasarkan {{ historyData.verse }}</p>
          </div>
        </div>
      </div>
    </header>

    <div class="container content-grid">
      <!-- MAIN: 7 ACCORDIONS FOR NARRATIVE -->
      <section class="narrative-section">
        <h2 class="section-heading">Perjalanan Sejarah Ranting</h2>
        <p class="section-intro">
          Ketuk tiap periode untuk membaca kisah perjalanan pelayanan secara lengkap.
        </p>

        <div class="accordion-list">
          <article
            v-for="section in historyData.sections"
            :key="section.id"
            :id="section.id"
            class="accordion-item"
            :class="{ 'is-open': openSections[section.id] }"
          >
            <button
              type="button"
              class="accordion-header"
              :aria-expanded="openSections[section.id] ? 'true' : 'false'"
              @click="toggleSection(section.id)"
            >
              <div class="header-titles">
                <span class="period-pill">{{ section.periodLabel }}</span>
                <span class="item-title">{{ section.title }}</span>
              </div>
              <ChevronDown
                :size="20"
                class="chevron-icon"
                :class="{ 'rotate-180': openSections[section.id] }"
                aria-hidden="true"
              />
            </button>

            <div
              v-show="openSections[section.id]"
              class="accordion-body"
              role="region"
            >
              <p class="section-text">{{ section.content }}</p>
            </div>
          </article>
        </div>

        <!-- YOUTUBE VIDEO FACADE -->
        <div class="video-facade-container" v-if="historyData.youtubeUrl">
          <h3 class="video-title">Dokumentasi Video Sejarah</h3>
          <div class="video-box">
            <template v-if="!showVideoIframe">
              <button
                type="button"
                class="video-cover-btn"
                @click="playVideo"
                aria-label="Putar video sejarah Ranting Talitakumi"
              >
                <div class="play-circle">
                  <Play :size="32" class="play-icon" />
                </div>
                <span class="play-text">Putar Video Sejarah</span>
              </button>
            </template>
            <template v-else>
              <iframe
                :src="`${historyData.youtubeUrl}&autoplay=1`"
                title="Video Sejarah Ranting Talitakumi"
                class="video-frame"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
              ></iframe>
            </template>
          </div>
        </div>
      </section>

      <!-- ASIDE: 6-POINT VERTICAL TIMELINE -->
      <aside class="timeline-aside">
        <div class="timeline-card">
          <h3 class="timeline-title">Garis Waktu Penting</h3>
          <p class="timeline-hint">Ketuk salah satu titik untuk melompat ke narasi.</p>

          <ol class="timeline-list">
            <li
              v-for="item in historyData.timeline"
              :key="item.id"
              class="timeline-node"
              @click="handleTimelineClick(item.sectionId)"
              role="button"
              tabindex="0"
              @keydown.enter="handleTimelineClick(item.sectionId)"
            >
              <div class="timeline-dot"></div>
              <div class="timeline-info">
                <strong class="timeline-year">{{ item.yearLabel }}</strong>
                <h4 class="timeline-item-title">{{ item.title }}</h4>
                <p class="timeline-desc">{{ item.description }}</p>
              </div>
            </li>
          </ol>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.history-view {
  padding-bottom: var(--space-12);
}

.page-header {
  background: linear-gradient(180deg, #f0f6fc 0%, var(--paper) 100%);
  padding: var(--space-8) 0 var(--space-6);
  border-bottom: 1px solid var(--border);
  margin-bottom: var(--space-8);
}

.page-title {
  margin-top: var(--space-2);
  margin-bottom: var(--space-2);
}

.meaning-card {
  margin-top: var(--space-6);
  background: var(--navy);
  color: var(--white);
  padding: var(--space-5);
  border-radius: var(--radius);
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  box-shadow: var(--shadow-md);
  border-left: 4px solid var(--gold);
}

.meaning-icon {
  color: var(--gold);
  flex-shrink: 0;
  margin-top: 2px;
}

.meaning-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meaning-label {
  font-size: 0.8rem;
  color: var(--teal-light);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.meaning-quote {
  font-family: var(--font-heading);
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--gold);
  line-height: 1.3;
}

.meaning-verse {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
}

/* CONTENT GRID */
.content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-8);
}

@media (min-width: 900px) {
  .content-grid {
    grid-template-columns: 1.6fr 1fr;
    align-items: start;
  }
}

.section-heading {
  font-size: 1.5rem;
  margin-bottom: var(--space-1);
}

.section-intro {
  color: var(--muted);
  font-size: 0.95rem;
  margin-bottom: var(--space-5);
}

/* ACCORDIONS */
.accordion-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.accordion-item {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  transition: all 0.2s ease;
}

.accordion-item.is-open {
  border-color: var(--teal);
  box-shadow: var(--shadow-sm);
}

.accordion-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: transparent;
  text-align: left;
  gap: var(--space-3);
}

.header-titles {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

@media (min-width: 600px) {
  .header-titles {
    flex-direction: row;
    align-items: center;
    gap: var(--space-3);
  }
}

.period-pill {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  background: #e6f0fa;
  color: var(--navy);
  border-radius: var(--radius-sm);
  width: fit-content;
}

.item-title {
  font-family: var(--font-heading);
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--ink);
}

.chevron-icon {
  color: var(--muted);
  transition: transform 0.25s ease;
  flex-shrink: 0;
}

.rotate-180 {
  transform: rotate(180deg);
  color: var(--teal);
}

.accordion-body {
  padding: 0 20px 20px 20px;
  border-top: 1px solid #f1f5f9;
}

.section-text {
  color: #334155;
  font-size: 0.98rem;
  line-height: 1.7;
  padding-top: 14px;
}

/* VIDEO FACADE */
.video-facade-container {
  margin-top: var(--space-8);
}

.video-title {
  font-size: 1.25rem;
  margin-bottom: var(--space-3);
}

.video-box {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  background: #051347;
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.video-cover-btn {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  background: linear-gradient(135deg, rgba(8, 28, 102, 0.95), rgba(5, 19, 71, 0.85));
  color: var(--white);
  transition: background 0.2s ease;
}

.video-cover-btn:hover {
  background: rgba(8, 28, 102, 0.8);
}

.play-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--gold);
  color: var(--ink);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s ease;
}

.video-cover-btn:hover .play-circle {
  transform: scale(1.1);
}

.play-icon {
  margin-left: 4px;
}

.play-text {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--gold);
}

.video-frame {
  width: 100%;
  height: 100%;
  border: none;
}

/* TIMELINE ASIDE */
.timeline-aside {
  position: sticky;
  top: 84px;
}

.timeline-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}

.timeline-title {
  font-size: 1.25rem;
  margin-bottom: 4px;
}

.timeline-hint {
  font-size: 0.8rem;
  color: var(--muted);
  margin-bottom: var(--space-5);
}

.timeline-list {
  list-style: none;
  position: relative;
  padding-left: 20px;
}

.timeline-list::before {
  content: '';
  position: absolute;
  top: 8px;
  bottom: 8px;
  left: 5px;
  width: 2px;
  background-color: #cbd5e1;
}

.timeline-node {
  position: relative;
  margin-bottom: var(--space-5);
  cursor: pointer;
  outline: none;
  border-radius: var(--radius-sm);
  padding: 4px 6px;
  transition: background 0.2s ease;
}

.timeline-node:last-child {
  margin-bottom: 0;
}

.timeline-node:hover,
.timeline-node:focus-visible {
  background-color: #f1f5f9;
}

.timeline-dot {
  position: absolute;
  left: -19px;
  top: 8px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--white);
  border: 3px solid var(--teal);
  transition: background 0.2s ease, transform 0.2s ease;
}

.timeline-node:hover .timeline-dot {
  background: var(--teal);
  transform: scale(1.2);
}

.timeline-year {
  display: block;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--teal);
}

.timeline-item-title {
  font-size: 0.95rem;
  font-family: var(--font-body);
  font-weight: 600;
  color: var(--ink);
  line-height: 1.3;
}

.timeline-desc {
  font-size: 0.82rem;
  color: var(--muted);
  line-height: 1.4;
  margin-top: 2px;
}
</style>

