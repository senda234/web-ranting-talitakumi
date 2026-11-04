<script setup lang="ts">
import { ref, computed } from 'vue';
import { useContentStore } from '@/stores/content';
import { ChevronDown, CheckCircle2 } from 'lucide-vue-next';

const contentStore = useContentStore();
const departments = computed(() => contentStore.visibleDepartments);
const programsByDepartment = computed(() => contentStore.programsByDepartment);

// Open states for mobile accordions (by default first department is open on mobile)
const openDepts = ref<Record<string, boolean>>({
  'dept-1': true,
});

function toggleDept(deptId: string) {
  openDepts.value[deptId] = !openDepts.value[deptId];
}
</script>

<template>
  <div class="programs-view">
    <!-- Header -->
    <header class="page-header">
      <div class="container">
        <span class="badge badge-teal">Program Pelayanan</span>
        <h1 class="page-title">Program Kerja Lima Bidang</h1>
        <p class="section-subtitle">
          Rangkaian program kerja AMGPM Ranting Talitakumi untuk membangun persekutuan, kesaksian, dan kemandirian pelayanan.
        </p>
      </div>
    </header>

    <div class="container programs-container">
      <div class="departments-stack">
        <article
          v-for="dept in departments"
          :key="dept.id"
          class="dept-section card"
          :class="{ 'is-open': openDepts[dept.id] }"
        >
          <!-- Dept Header / Accordion trigger on mobile -->
          <button
            type="button"
            class="dept-toggle"
            :aria-expanded="openDepts[dept.id] ? 'true' : 'false'"
            @click="toggleDept(dept.id)"
          >
            <div class="dept-left">
              <span class="dept-rom-badge">{{ dept.romanNumber }}</span>
              <div class="dept-headings">
                <span class="dept-kicker">Bidang {{ dept.romanNumber }}</span>
                <h2 class="dept-main-name">{{ dept.name }}</h2>
              </div>
            </div>

            <div class="dept-right">
              <span class="dept-pill">
                {{ (programsByDepartment[dept.id] || []).length }} Program
              </span>
              <ChevronDown
                :size="20"
                class="chevron-indicator"
                :class="{ 'rotate-180': openDepts[dept.id] }"
                aria-hidden="true"
              />
            </div>
          </button>

          <!-- Dept Content / Program List -->
          <div
            v-show="openDepts[dept.id]"
            class="programs-list-wrapper"
            role="region"
          >
            <!-- Banner Foto Bidang Pelayanan -->
            <div v-if="dept.imageUrl" class="dept-banner-wrap">
              <img
                :src="dept.imageUrl"
                :alt="`Dokumentasi Bidang ${dept.romanNumber} - ${dept.name}`"
                class="dept-banner-img"
                loading="lazy"
              />
              <div class="dept-banner-overlay">
                <span class="dept-banner-tag">Bidang {{ dept.romanNumber }} &bull; {{ dept.name }}</span>
              </div>
            </div>

            <p class="dept-overview">{{ dept.description }}</p>

            <div class="program-cards-grid">
              <div
                v-for="prog in programsByDepartment[dept.id] || []"
                :key="prog.id"
                class="program-unit"
              >
                <div class="program-head">
                  <CheckCircle2 :size="18" class="prog-icon" aria-hidden="true" />
                  <h3 class="prog-name">{{ prog.name }}</h3>
                </div>

                <div class="activities-wrap">
                  <div class="activities-label">Rincian Kegiatan:</div>
                  <ul class="activities-list">
                    <li
                      v-for="act in prog.activities"
                      :key="act.id"
                      class="activity-item"
                    >
                      <span>{{ act.name }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<style scoped>
.programs-view {
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
  margin-bottom: var(--space-1);
}

.programs-container {
  max-width: 960px;
}

.departments-stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.dept-section {
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--border);
  transition: all 0.2s ease;
}

.dept-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  background: #ffffff;
  border: none;
  cursor: pointer;
  text-align: left;
  gap: var(--space-3);
  transition: background-color 0.2s ease;
}

.dept-toggle:hover {
  background-color: #f8fafc;
}

.dept-left {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.dept-rom-badge {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
  background: var(--navy);
  color: var(--gold);
  font-family: var(--font-heading);
  font-size: 1.4rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.dept-headings {
  display: flex;
  flex-direction: column;
}

.dept-kicker {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--teal);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dept-main-name {
  font-size: 1.3rem;
  margin: 0;
  color: var(--ink);
  line-height: 1.25;
}

.dept-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.dept-pill {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--navy);
  background: #e2e8f0;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  white-space: nowrap;
}

.chevron-indicator {
  color: var(--muted);
  transition: transform 0.25s ease;
  flex-shrink: 0;
}

.rotate-180 {
  transform: rotate(180deg);
  color: var(--teal);
}

.programs-list-wrapper {
  padding: 0 22px 24px 22px;
  border-top: 1px solid #f1f5f9;
  background: #fafcff;
}

.dept-banner-wrap {
  position: relative;
  width: 100%;
  max-height: 280px;
  border-radius: var(--radius);
  overflow: hidden;
  margin-top: 18px;
  box-shadow: var(--shadow-sm);
  background: var(--navy);
}

.dept-banner-img {
  width: 100%;
  height: 240px;
  object-fit: cover;
  object-position: center;
  display: block;
}

.dept-banner-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(180deg, transparent 0%, rgba(10, 26, 47, 0.85) 100%);
  padding: 16px 16px 12px;
}

.dept-banner-tag {
  color: var(--white);
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.dept-overview {
  font-size: 0.92rem;
  color: var(--muted);
  padding: 14px 0 12px;
}

.program-cards-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

@media (min-width: 680px) {
  .program-cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.program-unit {
  background: var(--white);
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-sm);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.program-head {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
}

.prog-icon {
  color: var(--teal);
  flex-shrink: 0;
  margin-top: 2px;
}

.prog-name {
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 1.05rem;
  color: var(--ink);
  line-height: 1.35;
  margin: 0;
}

.activities-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-left: 26px;
}

.activities-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--muted);
  letter-spacing: 0.5px;
}

.activities-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.activity-item {
  position: relative;
  font-size: 0.9rem;
  color: #334155;
  line-height: 1.45;
  padding-left: 14px;
}

.activity-item::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--teal);
  font-weight: bold;
}
</style>

