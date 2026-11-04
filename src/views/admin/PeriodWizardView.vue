<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useContentStore } from '@/stores/content';
import { ArrowLeft, CheckCircle2, Copy, Sparkles, AlertTriangle } from 'lucide-vue-next';

const router = useRouter();
const contentStore = useContentStore();

const currentStep = ref(1);

// Step 1: Info Periode Baru
const newPeriodName = ref('Periode 2026–2028');
const startYear = ref(2026);
const endYear = ref(2028);

// Step 2: Strategi Awal
const copyStrategy = ref<'COPY' | 'BLANK'>('COPY');

// Step 3: Konfirmasi & Aktivasi
const isConfirmChecked = ref(false);
const isSubmitting = ref(false);

function handleActivate() {
  isSubmitting.value = true;

  setTimeout(() => {
    // 1. Update active period in store
    contentStore.activePeriod = {
      id: `period-${startYear.value}-${endYear.value}`,
      name: newPeriodName.value,
      startYear: startYear.value,
      endYear: endYear.value,
      isActive: true,
    };
    try {
      localStorage.setItem('talitakumi_activePeriod', JSON.stringify(contentStore.activePeriod));
    } catch {}

    // 2. If BLANK strategy, clear names
    if (copyStrategy.value === 'BLANK') {
      contentStore.officers.forEach((o) => {
        o.name = `[Belum Ditentukan]`;
        o.photoUrl = undefined;
        o.instagram = undefined;
      });
      try {
        localStorage.setItem('talitakumi_officers', JSON.stringify(contentStore.officers));
      } catch {}
    }

    isSubmitting.value = false;
    router.push('/admin/pengurus');
  }, 500);
}
</script>

<template>
  <div class="period-wizard">
    <div class="wizard-header">
      <RouterLink to="/admin/pengurus" class="back-link">
        <ArrowLeft :size="18" />
        <span>Kembali ke Pengurus</span>
      </RouterLink>
      <h1 class="page-title">Mulai Periode Kepengurusan Baru</h1>
      <p class="page-desc">
        Panduan 3 langkah untuk mengalihkan periode pelayanan secara aman. Periode lama akan diarsipkan otomatis tanpa ada data yang terhapus.
      </p>
    </div>

    <!-- STEP PROGRESS INDICATOR -->
    <div class="stepper-bar card">
      <div class="step-item" :class="{ 'is-active': currentStep >= 1 }">
        <span class="step-circle">1</span>
        <span class="step-label">Nama & Tahun</span>
      </div>
      <div class="step-divider" :class="{ 'is-active': currentStep >= 2 }"></div>
      <div class="step-item" :class="{ 'is-active': currentStep >= 2 }">
        <span class="step-circle">2</span>
        <span class="step-label">Titik Awal Slot</span>
      </div>
      <div class="step-divider" :class="{ 'is-active': currentStep >= 3 }"></div>
      <div class="step-item" :class="{ 'is-active': currentStep >= 3 }">
        <span class="step-circle">3</span>
        <span class="step-label">Konfirmasi & Aktifkan</span>
      </div>
    </div>

    <!-- STEP 1 -->
    <div v-if="currentStep === 1" class="step-card card">
      <h2 class="step-title">Langkah 1: Nama & Rentang Tahun Periode</h2>
      <p class="step-desc">Tentukan identitas periode kepengurusan yang akan datang.</p>

      <div class="wizard-form">
        <div class="form-group">
          <label class="form-label">Nama Periode</label>
          <input
            v-model="newPeriodName"
            type="text"
            class="form-input"
            placeholder="Periode 2026–2028"
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Tahun Mulai</label>
            <input v-model.number="startYear" type="number" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Tahun Selesai</label>
            <input v-model.number="endYear" type="number" class="form-input" />
          </div>
        </div>

        <div class="wizard-actions">
          <div></div>
          <button type="button" class="btn btn-primary" @click="currentStep = 2">
            Lanjut ke Titik Awal →
          </button>
        </div>
      </div>
    </div>

    <!-- STEP 2 -->
    <div v-if="currentStep === 2" class="step-card card">
      <h2 class="step-title">Langkah 2: Pilih Titik Awal Susunan 15 Slot</h2>
      <p class="step-desc">
        Bagaimana Anda ingin memulai susunan pengurus untuk periode baru ini?
      </p>

      <div class="strategy-options">
        <label
          class="strategy-card"
          :class="{ 'is-selected': copyStrategy === 'COPY' }"
        >
          <input v-model="copyStrategy" type="radio" value="COPY" class="radio-input" />
          <div class="strategy-body">
            <div class="strategy-icon-wrap">
              <Copy :size="24" />
            </div>
            <div>
              <strong class="strategy-name">Salin Susunan Periode Saat Ini (Disarankan)</strong>
              <p class="strategy-desc">
                Struktur 15 slot akan diisi dengan data periode berjalan, sehingga Anda tinggal mengganti nama yang berganti saja.
              </p>
            </div>
          </div>
        </label>

        <label
          class="strategy-card"
          :class="{ 'is-selected': copyStrategy === 'BLANK' }"
        >
          <input v-model="copyStrategy" type="radio" value="BLANK" class="radio-input" />
          <div class="strategy-body">
            <div class="strategy-icon-wrap">
              <Sparkles :size="24" />
            </div>
            <div>
              <strong class="strategy-name">Mulai dengan Slot Kosong</strong>
              <p class="strategy-desc">
                Struktur 15 posisi baku tetap siap, tetapi seluruh nama dan foto dikosongkan untuk diisi dari awal.
              </p>
            </div>
          </div>
        </label>
      </div>

      <div class="wizard-actions">
        <button type="button" class="btn btn-outline" @click="currentStep = 1">
          ← Kembali
        </button>
        <button type="button" class="btn btn-primary" @click="currentStep = 3">
          Lanjut ke Konfirmasi →
        </button>
      </div>
    </div>

    <!-- STEP 3 -->
    <div v-if="currentStep === 3" class="step-card card">
      <h2 class="step-title">Langkah 3: Konfirmasi dan Pengaktifan</h2>
      <p class="step-desc">
        Tinjau ringkasan sebelum mengaktifkan periode kepengurusan baru ke situs publik.
      </p>

      <div class="summary-box">
        <div class="summary-item">
          <span>Periode Baru:</span>
          <strong>{{ newPeriodName }} ({{ startYear }}–{{ endYear }})</strong>
        </div>
        <div class="summary-item">
          <span>Periode Sebelumnya:</span>
          <span>{{ contentStore.activePeriod.name }} (Diarsipkan Otomatis)</span>
        </div>
        <div class="summary-item">
          <span>Strategi Slot:</span>
          <span>{{ copyStrategy === 'COPY' ? 'Salin nama pengurus' : 'Slot kosong baru' }}</span>
        </div>
      </div>

      <div class="warning-alert">
        <AlertTriangle :size="24" class="alert-icon" />
        <div>
          <strong>Perhatian:</strong>
          <p>
            Setelah periode baru diaktifkan, halaman publik akan langsung menampilkan nama periode baru ini. Anda dapat langsung melengkapi foto dan nama di halaman Pengurus.
          </p>
        </div>
      </div>

      <label class="confirm-check">
        <input v-model="isConfirmChecked" type="checkbox" />
        <span>Saya memahami dan ingin mengaktifkan periode ini sekarang.</span>
      </label>

      <div class="wizard-actions">
        <button type="button" class="btn btn-outline" @click="currentStep = 2">
          ← Kembali
        </button>
        <button
          type="button"
          class="btn btn-gold"
          :disabled="!isConfirmChecked || isSubmitting"
          @click="handleActivate"
        >
          <CheckCircle2 :size="18" />
          <span>{{ isSubmitting ? 'Mengaktifkan...' : 'Aktifkan Periode Baru' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.period-wizard {
  max-width: 760px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--teal);
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: var(--space-3);
  text-decoration: none;
}

.page-title {
  font-size: 1.85rem;
  margin: 0;
}

.page-desc {
  color: var(--muted);
  font-size: 0.95rem;
  margin-top: 4px;
}

/* STEPPER */
.stepper-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--muted);
}

.step-item.is-active {
  color: var(--teal);
  font-weight: 600;
}

.step-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
}

.step-item.is-active .step-circle {
  background: var(--teal);
  color: var(--white);
}

.step-label {
  font-size: 0.85rem;
}

.step-divider {
  flex: 1;
  height: 2px;
  background: #e2e8f0;
  margin: 0 12px;
}

.step-divider.is-active {
  background: var(--teal);
}

/* STEP CARD */
.step-card {
  padding: var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.step-title {
  font-size: 1.4rem;
  margin: 0;
}

.step-desc {
  color: var(--muted);
  font-size: 0.92rem;
  margin: 0;
}

.wizard-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
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
  font-size: 0.95rem;
}

/* STRATEGY */
.strategy-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.strategy-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  padding: var(--space-5);
  border: 1.5px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.2s ease;
}

.strategy-card:hover {
  background: #f8fafc;
}

.strategy-card.is-selected {
  border-color: var(--teal);
  background: #f0fdfa;
}

.radio-input {
  margin-top: 4px;
}

.strategy-body {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
}

.strategy-icon-wrap {
  color: var(--teal);
  flex-shrink: 0;
}

.strategy-name {
  font-size: 1.05rem;
  color: var(--ink);
  display: block;
}

.strategy-desc {
  font-size: 0.85rem;
  color: var(--muted);
  margin-top: 4px;
  line-height: 1.4;
}

/* SUMMARY & CONFIRM */
.summary-box {
  background: #f8fafc;
  border-radius: var(--radius-sm);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.92rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
}

.warning-alert {
  background: #fffbeb;
  border: 1px solid #fde68a;
  padding: 14px 18px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  color: #92400e;
}

.alert-icon {
  color: #b45309;
  flex-shrink: 0;
}

.warning-alert p {
  font-size: 0.85rem;
  margin: 4px 0 0;
}

.confirm-check {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  padding: 8px 0;
}

.wizard-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--space-4);
  border-top: 1px solid var(--border);
}
</style>

