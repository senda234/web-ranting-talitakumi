<script setup lang="ts">
import { computed } from 'vue';
import { useContentStore } from '@/stores/content';
import { Instagram, ShieldCheck } from 'lucide-vue-next';
import type { Officer } from '@/types';

const contentStore = useContentStore();
const activePeriod = computed(() => contentStore.activePeriod);
const coreLeaders = computed(() => contentStore.coreLeaders);
const departments = computed(() => contentStore.visibleDepartments);
const departmentOfficers = computed(() => contentStore.departmentOfficers);

const coreOfficersList = computed(() => {
  const c = coreLeaders.value;
  return [c.ketua, c.sekretaris, c.bendahara, c.bendahara1, c.bendahara2].filter(
    Boolean
  ) as Officer[];
});

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}
</script>

<template>
  <div class="officers-view">
    <!-- Header -->
    <header class="page-header">
      <div class="container">
        <span class="badge badge-navy">{{ activePeriod.name }}</span>
        <h1 class="page-title">Susunan Pengurus Ranting</h1>
        <p class="section-subtitle">
          Mereka yang dipercayakan untuk melayani, mengarahkan, dan menjaga persekutuan dalam semangat Talita Kum.
        </p>
      </div>
    </header>

    <div class="container officers-content">
      <!-- 1. PENGURUS INTI -->
      <section class="officer-group">
        <div class="group-header">
          <div class="group-title-wrap">
            <ShieldCheck class="group-icon" :size="20" aria-hidden="true" />
            <h2 class="group-title">Pengurus Inti</h2>
          </div>
          <span class="group-count">{{ coreOfficersList.length }} Orang</span>
        </div>

        <div class="officers-grid core-grid">
          <article
            v-for="officer in coreOfficersList"
            :key="officer.id"
            class="officer-card card"
          >
            <div class="photo-wrapper">
              <img
                v-if="officer.photoUrl"
                :src="officer.photoUrl"
                :alt="`Foto ${officer.name}`"
                loading="lazy"
                class="officer-photo"
              />
              <div v-else class="initials-avatar" aria-hidden="true">
                {{ getInitials(officer.name) }}
              </div>
            </div>

            <div class="officer-meta">
              <span class="officer-role">{{ officer.title }}</span>
              <h3 class="officer-name">{{ officer.name }}</h3>

              <a
                v-if="officer.instagram"
                :href="`https://instagram.com/${officer.instagram}`"
                target="_blank"
                rel="noopener noreferrer"
                class="ig-link"
                :aria-label="`Instagram ${officer.name}`"
                title="Instagram"
              >
                <Instagram :size="15" aria-hidden="true" />
                <span class="ig-text">@{{ officer.instagram }}</span>
              </a>
            </div>
          </article>
        </div>
      </section>

      <!-- 2. LIMA BIDANG -->
      <section class="officer-group">
        <div class="group-header">
          <h2 class="group-title">Koordinator Bidang Pelayanan</h2>
        </div>

        <div class="departments-container">
          <div
            v-for="dept in departments"
            :key="dept.id"
            class="dept-block card"
          >
            <div class="dept-head">
              <span class="dept-num">{{ dept.romanNumber }}</span>
              <div>
                <h3 class="dept-title">Bidang {{ dept.romanNumber }} — {{ dept.name }}</h3>
                <p class="dept-desc">{{ dept.description }}</p>
              </div>
            </div>

            <div class="dept-officers-grid">
              <article
                v-for="officer in departmentOfficers[dept.id] || []"
                :key="officer.id"
                class="dept-officer-item"
              >
                <div class="dept-avatar">
                  <img
                    v-if="officer.photoUrl"
                    :src="officer.photoUrl"
                    :alt="`Foto ${officer.name}`"
                    loading="lazy"
                  />
                  <div v-else class="initials-avatar small">
                    {{ getInitials(officer.name) }}
                  </div>
                </div>

                <div class="dept-officer-info">
                  <span class="dept-officer-role">{{ officer.title }}</span>
                  <h4 class="dept-officer-name">{{ officer.name }}</h4>

                  <a
                    v-if="officer.instagram"
                    :href="`https://instagram.com/${officer.instagram}`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="ig-link"
                    :aria-label="`Instagram ${officer.name}`"
                  >
                    <Instagram :size="14" aria-hidden="true" />
                    <span class="ig-text">@{{ officer.instagram }}</span>
                  </a>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.officers-view {
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

.officers-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-10);
}

.officer-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: var(--space-2);
  border-bottom: 2px solid #e2e8f0;
}

.group-title-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.group-icon {
  color: var(--teal);
}

.group-title {
  font-size: 1.5rem;
  margin: 0;
}

.group-count {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--muted);
}

/* CARDS & GRIDS */
.officers-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

@media (min-width: 540px) {
  .core-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 860px) {
  .core-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1080px) {
  .core-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

.officer-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-5);
  gap: var(--space-3);
}

.photo-wrapper {
  width: 110px;
  height: 110px;
  border-radius: var(--radius);
  overflow: hidden;
  background-color: var(--navy);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.officer-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.officer-card:hover .officer-photo {
  transform: scale(1.05);
}

.initials-avatar {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--navy), #0a2544);
  color: var(--gold);
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.initials-avatar.small {
  font-size: 1.25rem;
}

.officer-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  width: 100%;
}

.officer-role {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--teal);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.officer-name {
  font-size: 1.15rem;
  margin: 0;
  color: var(--ink);
  line-height: 1.3;
}

.ig-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem;
  color: var(--muted);
  text-decoration: none;
  margin-top: 4px;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
  min-height: 28px;
}

.ig-link:hover {
  color: var(--navy);
  background-color: #eef4fb;
}

.ig-text {
  font-weight: 500;
}

/* DEPARTMENTS CONTAINER */
.departments-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.dept-block {
  padding: var(--space-5);
}

.dept-head {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding-bottom: var(--space-4);
  margin-bottom: var(--space-4);
  border-bottom: 1px solid #f1f5f9;
}

.dept-num {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-sm);
  background: var(--navy);
  color: var(--gold);
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.dept-title {
  font-size: 1.25rem;
  margin: 0;
  color: var(--ink);
}

.dept-desc {
  font-size: 0.85rem;
  color: var(--muted);
  margin-top: 2px;
}

.dept-officers-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
}

@media (min-width: 600px) {
  .dept-officers-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.dept-officer-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: #f8fafc;
  border-radius: var(--radius-sm);
  border: 1px solid #edf2f7;
}

.dept-avatar {
  width: 58px;
  height: 58px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background-color: var(--navy);
  flex-shrink: 0;
}

.dept-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dept-officer-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dept-officer-role {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--teal);
  text-transform: uppercase;
}

.dept-officer-name {
  font-size: 1rem;
  font-family: var(--font-body);
  font-weight: 600;
  margin: 0;
  color: var(--ink);
}
</style>

