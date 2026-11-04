<script setup lang="ts">
import { ref, computed } from 'vue';
import { RouterLink } from 'vue-router';
import { useContentStore } from '@/stores/content';
import { useNotificationStore } from '@/stores/notifications';
import {
  Sparkles,
  Edit2,
  Instagram,
  X,
  UploadCloud,
  Trash2,
  Image as ImageIcon,
  Check,
} from 'lucide-vue-next';
import type { Officer } from '@/types';
import { uploadImageFile } from '@/utils/uploader';

const contentStore = useContentStore();
const notificationStore = useNotificationStore();
const activePeriod = computed(() => contentStore.activePeriod);
const officers = computed(() => contentStore.officers);
const departments = computed(() => contentStore.visibleDepartments);

// Editing officer modal
const editingOfficer = ref<Officer | null>(null);
const formName = ref('');
const formPhotoUrl = ref('');
const formInstagram = ref('');
const formIsVisible = ref(true);

// Upload state for officer photo
const isUploadingPhoto = ref(false);
const uploadStatus = ref('');
const fileInputRef = ref<HTMLInputElement | null>(null);

function openEditModal(officer: Officer) {
  editingOfficer.value = officer;
  formName.value = officer.name;
  formPhotoUrl.value = officer.photoUrl || '';
  formInstagram.value = officer.instagram || '';
  formIsVisible.value = officer.isVisible;
  uploadStatus.value = '';
}

function triggerPhotoSelect() {
  fileInputRef.value?.click();
}

async function handlePhotoSelected(e: Event) {
  const input = e.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];
  isUploadingPhoto.value = true;
  uploadStatus.value = 'Mengunggah foto...';

  try {
    const res = await uploadImageFile(file, 'talitakumi/officers', (status) => {
      uploadStatus.value = status;
    });
    formPhotoUrl.value = res.url;
    uploadStatus.value = 'Foto berhasil diunggah!';
    notificationStore.success('Foto berhasil diunggah');
    setTimeout(() => {
      uploadStatus.value = '';
    }, 2000);
  } catch (err: any) {
    uploadStatus.value = 'Gagal mengunggah foto.';
    notificationStore.error('Foto gagal diunggah', 'Periksa koneksi dan coba ulang.');
  } finally {
    isUploadingPhoto.value = false;
    input.value = '';
  }
}

function removePhoto() {
  formPhotoUrl.value = '';
  uploadStatus.value = '';
}

async function saveOfficer() {
  if (!editingOfficer.value) return;

  const updatedName = formName.value.trim();
  const updatedPhotoUrl = formPhotoUrl.value.trim() || undefined;
  const updatedInstagram = formInstagram.value.trim() || undefined;
  const updatedIsVisible = formIsVisible.value;

  editingOfficer.value.name = updatedName;
  editingOfficer.value.photoUrl = updatedPhotoUrl;
  editingOfficer.value.instagram = updatedInstagram;
  editingOfficer.value.isVisible = updatedIsVisible;

  // Sinkronisasi ke store & localStorage
  contentStore.updateOfficer(editingOfficer.value.id || editingOfficer.value.positionKey, {
    name: updatedName,
    photoUrl: updatedPhotoUrl,
    instagram: updatedInstagram,
    isVisible: updatedIsVisible,
  });

  // Sinkronisasi pembaruan ke Neon PostgreSQL
  try {
    await fetch('/api/admin/officers', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-auth': 'true',
      },
      body: JSON.stringify({
        id: editingOfficer.value.id,
        positionKey: editingOfficer.value.positionKey,
        name: updatedName,
        photoUrl: updatedPhotoUrl || null,
        instagram: updatedInstagram || null,
        isVisible: updatedIsVisible,
      }),
    });
  } catch {
    // Non-blocking local store updated
  }

  editingOfficer.value = null;
  notificationStore.success('Perubahan berhasil disimpan', `Data ${updatedName} telah diperbarui.`);
}
</script>

<template>
  <div class="officers-admin">
    <div class="admin-page-header">
      <div>
        <h1 class="page-title">Susunan Pengurus Ranting</h1>
        <p class="page-desc">
          Kelola data 15 pengurus aktif pada <strong>{{ activePeriod.name }}</strong>.
        </p>
      </div>
      <RouterLink to="/admin/pengurus/wizard" class="btn btn-gold">
        <Sparkles :size="18" />
        <span>Mulai Periode Baru</span>
      </RouterLink>
    </div>

    <!-- 15 SLOTS WORKSPACE -->
    <div class="slots-container">
      <!-- Pengurus Inti (5 slots) -->
      <section class="slots-group card">
        <h2 class="group-title">Pengurus Inti (5 Posisi Baku)</h2>
        <div class="slots-grid core-slots">
          <div v-for="off in officers.filter((o) => !o.departmentId)" :key="off.id" class="slot-card"
            :class="{ 'is-hidden': !off.isVisible }" @click="openEditModal(off)" role="button" tabindex="0">
            <div class="slot-avatar">
              <img v-if="off.photoUrl" :src="off.photoUrl" :alt="off.name" />
              <div v-else class="initials">{{ off.name.charAt(0) }}</div>
            </div>

            <div class="slot-info">
              <span class="slot-role">{{ off.title }}</span>
              <h3 class="slot-name">{{ off.name }}</h3>
              <span v-if="off.instagram" class="slot-ig">@{{ off.instagram }}</span>
            </div>

            <button type="button" class="slot-edit-btn" title="Ubah data pengurus">
              <Edit2 :size="15" />
            </button>
          </div>
        </div>
      </section>

      <!-- Lima Bidang (10 slots) -->
      <section class="slots-group card">
        <h2 class="group-title">Koordinator Lima Bidang (10 Posisi Baku)</h2>
        <div class="depts-slots-stack">
          <div v-for="dept in departments" :key="dept.id" class="dept-slot-row">
            <div class="dept-label">
              <span class="dept-badge">{{ dept.romanNumber }}</span>
              <strong>Bidang {{ dept.romanNumber }} — {{ dept.name }}</strong>
            </div>

            <div class="dept-slots-grid">
              <div v-for="off in officers.filter((o) => o.departmentId === dept.id)" :key="off.id" class="slot-card"
                :class="{ 'is-hidden': !off.isVisible }" @click="openEditModal(off)" role="button" tabindex="0">
                <div class="slot-avatar small">
                  <img v-if="off.photoUrl" :src="off.photoUrl" :alt="off.name" />
                  <div v-else class="initials">{{ off.name.charAt(0) }}</div>
                </div>

                <div class="slot-info">
                  <span class="slot-role">{{ off.title }}</span>
                  <h3 class="slot-name">{{ off.name }}</h3>
                  <span v-if="off.instagram" class="slot-ig">@{{ off.instagram }}</span>
                </div>

                <button type="button" class="slot-edit-btn" title="Ubah data">
                  <Edit2 :size="15" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- EDIT OFFICER MODAL -->
    <div v-if="editingOfficer" class="modal-backdrop" @click.self="editingOfficer = null">
      <div class="modal-card card">
        <div class="modal-head">
          <div>
            <span class="badge badge-teal">{{ editingOfficer.title }}</span>
            <h2>Ubah Data Pengurus</h2>
          </div>
          <button type="button" class="close-modal-btn" @click="editingOfficer = null">
            <X :size="20" />
          </button>
        </div>

        <div class="modal-form">
          <div class="form-group">
            <label class="form-label">Nama Lengkap</label>
            <input v-model="formName" type="text" class="form-input" required />
          </div>

          <div class="form-group photo-upload-group">
            <label class="form-label">Foto Pengurus</label>
            <div class="photo-upload-box">
              <div class="officer-preview-avatar">
                <img v-if="formPhotoUrl" :src="formPhotoUrl" :alt="formName" class="preview-img" />
                <div v-else class="initials-placeholder">
                  {{ formName ? formName.charAt(0) : '?' }}
                </div>
              </div>

              <div class="upload-controls">
                <input ref="fileInputRef" type="file" accept="image/*" class="hidden-file-input"
                  @change="handlePhotoSelected" />
                <button type="button" class="btn btn-sm btn-outline" :disabled="isUploadingPhoto"
                  @click="triggerPhotoSelect">
                  <UploadCloud :size="16" />
                  <span>{{ isUploadingPhoto ? 'Mengunggah...' : (formPhotoUrl ? 'Ganti Foto' : 'Unggah Foto') }}</span>
                </button>
                <button v-if="formPhotoUrl" type="button" class="btn btn-sm btn-ghost text-danger" @click="removePhoto"
                  title="Hapus foto">
                  <Trash2 :size="15" />
                  <span>Hapus Foto</span>
                </button>
              </div>
            </div>
            <span v-if="uploadStatus" class="upload-status-text" :class="{ 'is-loading': isUploadingPhoto }">
              {{ uploadStatus }}
            </span>
            <span v-else class="field-hint">
              Pilih foto dari komputer/HP (JPG, PNG, WebP). Foto otomatis diunggah ke cloud dan path tersimpan di Neon.
            </span>
          </div>

          <div class="form-group">
            <label class="form-label">Akun Instagram (Opsional)</label>
            <div class="ig-input-wrap">
              <span class="ig-prefix">@</span>
              <input v-model="formInstagram" type="text" placeholder="username" class="form-input ig-field" />
            </div>
            <span class="field-hint">Hanya diisi bila pengurus setuju akun ditampilkan ke publik.</span>
          </div>

          <div class="form-group toggle-row">
            <label class="toggle-label">
              <input v-model="formIsVisible" type="checkbox" />
              <span>Tampilkan pada halaman publik</span>
            </label>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline" @click="editingOfficer = null">
              Batal
            </button>
            <button type="button" class="btn btn-primary" @click="saveOfficer">
              Simpan Perubahan
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.officers-admin {
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

.slots-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.slots-group {
  padding: var(--space-5);
}

.group-title {
  font-size: 1.25rem;
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--border);
}

.slots-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
}

@media (min-width: 600px) {
  .core-slots {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 960px) {
  .core-slots {
    grid-template-columns: repeat(3, 1fr);
  }
}

.slot-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 12px;
  background: #f8fafc;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.slot-card:hover {
  background: #eef5fb;
  border-color: var(--teal);
  transform: translateY(-1px);
}

.slot-card.is-hidden {
  opacity: 0.55;
  background: #f1f5f9;
}

.slot-avatar {
  width: 54px;
  height: 54px;
  border-radius: var(--radius-sm);
  background: var(--navy);
  overflow: hidden;
  flex-shrink: 0;
}

.slot-avatar.small {
  width: 46px;
  height: 46px;
}

.slot-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.initials {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-heading);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gold);
}

.slot-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.slot-role {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--teal);
  text-transform: uppercase;
}

.slot-name {
  font-size: 1rem;
  font-family: var(--font-body);
  font-weight: 600;
  color: var(--ink);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.slot-ig {
  font-size: 0.75rem;
  color: var(--muted);
}

.slot-edit-btn {
  color: var(--muted);
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  border-radius: var(--radius-sm);
}

.slot-card:hover .slot-edit-btn {
  color: var(--teal);
}

/* BIDANG ROWS */
.depts-slots-stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.dept-slot-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: 12px;
  background: #fafcff;
  border-radius: var(--radius-sm);
  border: 1px solid #edf2f7;
}

.dept-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 0.92rem;
  color: var(--ink);
}

.dept-badge {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  background: var(--navy);
  color: var(--gold);
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dept-slots-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
}

@media (min-width: 600px) {
  .dept-slots-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* MODAL */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: var(--space-4);
}

.modal-card {
  width: 100%;
  max-width: 480px;
  padding: var(--space-6);
}

.modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.modal-head h2 {
  font-size: 1.35rem;
  margin: 4px 0 0;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-label {
  font-size: 0.82rem;
  font-weight: 600;
}

.form-input {
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.95rem;
}

.ig-input-wrap {
  display: flex;
  align-items: center;
}

.ig-prefix {
  padding: 10px 14px;
  background: #f1f5f9;
  border: 1px solid var(--border);
  border-right: none;
  border-radius: var(--radius-sm) 0 0 var(--radius-sm);
  color: var(--muted);
  font-weight: 600;
}

.ig-field {
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  flex: 1;
}

.field-hint {
  font-size: 0.75rem;
  color: var(--muted);
}

.toggle-row {
  margin-top: 4px;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

/* PHOTO UPLOAD IN MODAL */
.photo-upload-group {
  margin-bottom: var(--space-1);
}

.photo-upload-box {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: 12px;
  background: #f8fafc;
  border: 1px dashed var(--border);
  border-radius: var(--radius-sm);
}

.officer-preview-avatar {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  overflow: hidden;
  background: var(--navy);
  flex-shrink: 0;
  border: 2px solid var(--white);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.initials-placeholder {
  color: var(--gold);
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1.5rem;
}

.upload-controls {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.hidden-file-input {
  display: none;
}

.upload-status-text {
  font-size: 0.78rem;
  color: var(--teal);
  font-weight: 600;
  margin-top: 4px;
}

.upload-status-text.is-loading {
  color: var(--blue);
}

.text-danger {
  color: #ef4444 !important;
}

.text-danger:hover {
  background: #fef2f2 !important;
}
</style>
