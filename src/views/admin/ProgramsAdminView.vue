<script setup lang="ts">
import { ref, computed } from 'vue';
import { useContentStore } from '@/stores/content';
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  ChevronDown,
  X,
  ListPlus,
  Image as ImageIcon,
  FolderPlus,
  UploadCloud,
} from 'lucide-vue-next';
import type { Department, Program, ProgramActivity } from '@/types';
import { uploadImageFile } from '@/utils/uploader';

const contentStore = useContentStore();
const departments = computed(() => contentStore.visibleDepartments);
const programsByDepartment = computed(() => contentStore.programsByDepartment);

// Open states
const openDepts = ref<Record<string, boolean>>({
  'dept-1': true,
  'dept-2': true,
  'dept-3': true,
  'dept-4': true,
  'dept-5': true,
});

function toggleDept(deptId: string) {
  openDepts.value[deptId] = !openDepts.value[deptId];
}

// Add/Edit Department Modal
const showDeptModal = ref(false);
const editingDept = ref<Department | null>(null);
const deptRoman = ref('');
const deptName = ref('');
const deptShortName = ref('');
const deptDescription = ref('');
const deptImageUrl = ref('');

// Department photo upload state
const isUploadingDeptPhoto = ref(false);
const deptUploadStatus = ref('');
const deptFileInputRef = ref<HTMLInputElement | null>(null);

function openNewDeptModal() {
  editingDept.value = null;
  deptRoman.value = '';
  deptName.value = '';
  deptShortName.value = '';
  deptDescription.value = '';
  deptImageUrl.value = '';
  deptUploadStatus.value = '';
  showDeptModal.value = true;
}

function openEditDeptModal(dept: Department) {
  editingDept.value = dept;
  deptRoman.value = dept.romanNumber;
  deptName.value = dept.name;
  deptShortName.value = dept.shortName || '';
  deptDescription.value = dept.description || '';
  deptImageUrl.value = dept.imageUrl || '';
  deptUploadStatus.value = '';
  showDeptModal.value = true;
}

function triggerDeptPhotoSelect() {
  deptFileInputRef.value?.click();
}

async function handleDeptPhotoSelected(e: Event) {
  const input = e.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];
  isUploadingDeptPhoto.value = true;
  deptUploadStatus.value = 'Mengunggah foto bidang...';

  try {
    const res = await uploadImageFile(file, 'talitakumi/departments', (status) => {
      deptUploadStatus.value = status;
    });
    deptImageUrl.value = res.url;
    deptUploadStatus.value = 'Foto bidang berhasil diunggah!';
    setTimeout(() => {
      deptUploadStatus.value = '';
    }, 2000);
  } catch (err) {
    deptUploadStatus.value = 'Gagal mengunggah foto bidang.';
  } finally {
    isUploadingDeptPhoto.value = false;
    input.value = '';
  }
}

function removeDeptPhoto() {
  deptImageUrl.value = '';
  deptUploadStatus.value = '';
}

async function saveDept() {
  if (!deptRoman.value.trim() || !deptName.value.trim()) {
    alert('Nomor romawi dan nama bidang wajib diisi');
    return;
  }

  const updates = {
    romanNumber: deptRoman.value.trim().toUpperCase(),
    name: deptName.value.trim(),
    shortName: deptShortName.value.trim() || deptRoman.value.trim().toUpperCase(),
    description: deptDescription.value.trim(),
    imageUrl: deptImageUrl.value.trim() || undefined,
  };

  if (editingDept.value) {
    contentStore.updateDepartment(editingDept.value.id, updates);
    // Asynchronously sync with Neon backend if connected
    try {
      await fetch('/api/admin/departments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingDept.value.id, ...updates }),
      });
    } catch {
      // local store already updated
    }
  } else {
    const created = contentStore.addDepartment({
      ...updates,
      sortOrder: contentStore.departments.length + 1,
      isVisible: true,
    });
    try {
      await fetch('/api/admin/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updates, sortOrder: created.sortOrder, isVisible: true }),
      });
    } catch {
      // local store already updated
    }
  }

  showDeptModal.value = false;
}

// Add/Edit Program Modal
const showProgramModal = ref(false);
const editingProgram = ref<Program | null>(null);
const selectedDeptId = ref('dept-1');
const programName = ref('');
const activityNames = ref<string[]>(['']);

function openNewProgramModal(deptId: string) {
  editingProgram.value = null;
  selectedDeptId.value = deptId;
  programName.value = '';
  activityNames.value = [''];
  showProgramModal.value = true;
}

function openEditProgramModal(prog: Program) {
  editingProgram.value = prog;
  selectedDeptId.value = prog.departmentId;
  programName.value = prog.name;
  activityNames.value =
    prog.activities.length > 0 ? prog.activities.map((a) => a.name) : [''];
  showProgramModal.value = true;
}

function addActivityField() {
  activityNames.value.push('');
}

function removeActivityField(index: number) {
  if (activityNames.value.length > 1) {
    activityNames.value.splice(index, 1);
  }
}

function saveProgram() {
  if (!programName.value.trim()) return;

  const validActivities: ProgramActivity[] = activityNames.value
    .filter((a) => a.trim().length > 0)
    .map((name, i) => ({
      id: `act-${Date.now()}-${i}`,
      programId: editingProgram.value ? editingProgram.value.id : `prog-${Date.now()}`,
      name: name.trim(),
      sortOrder: i + 1,
    }));

  if (editingProgram.value) {
    editingProgram.value.name = programName.value.trim();
    editingProgram.value.departmentId = selectedDeptId.value;
    editingProgram.value.activities = validActivities;
  } else {
    const dept = departments.value.find((d) => d.id === selectedDeptId.value);
    const newProg: Program = {
      id: `prog-${Date.now()}`,
      departmentId: selectedDeptId.value,
      departmentName: dept?.name,
      departmentRoman: dept?.romanNumber,
      periodId: contentStore.activePeriod.id,
      name: programName.value.trim(),
      sortOrder: contentStore.programs.length + 1,
      isVisible: true,
      activities: validActivities,
    };
    contentStore.programs.push(newProg);
  }

  showProgramModal.value = false;
}

function toggleProgramVisibility(prog: Program) {
  prog.isVisible = !prog.isVisible;
}

function deleteProgram(progId: string) {
  if (confirm('Apakah Anda yakin ingin menghapus program ini?')) {
    const idx = contentStore.programs.findIndex((p) => p.id === progId);
    if (idx !== -1) {
      contentStore.programs.splice(idx, 1);
    }
  }
}
</script>

<template>
  <div class="programs-admin">
    <div class="admin-page-header">
      <div>
        <h1 class="page-title">Program Kerja Lima Bidang</h1>
        <p class="page-desc">Kelola program kerja, susunan kegiatan, dan foto bidang pelayanan.</p>
      </div>
      <div class="header-actions">
        <button type="button" class="btn btn-outline" @click="openNewDeptModal">
          <FolderPlus :size="16" />
          <span>Tambah Bidang</span>
        </button>
      </div>
    </div>

    <div class="depts-stack">
      <article v-for="dept in departments" :key="dept.id" class="dept-panel card">
        <div class="dept-bar" @click="toggleDept(dept.id)">
          <div class="dept-left">
            <div class="dept-thumb-container">
              <img v-if="dept.imageUrl" :src="dept.imageUrl" :alt="dept.name" class="dept-thumb-img" />
              <span v-else class="dept-badge">{{ dept.romanNumber }}</span>
            </div>
            <div>
              <div class="dept-title-row">
                <span class="dept-tag-pill">Bidang {{ dept.romanNumber }}</span>
                <h2 class="dept-title">{{ dept.name }}</h2>
              </div>
              <span class="dept-count">
                {{ (programsByDepartment[dept.id] || []).length }} Program Kerja
                <span v-if="dept.description" class="dept-desc-snippet">&bull; {{ dept.description }}</span>
              </span>
            </div>
          </div>

          <div class="dept-actions" @click.stop>
            <button type="button" class="btn btn-sm btn-ghost" @click="openEditDeptModal(dept)"
              title="Ubah info dan foto bidang">
              <Edit2 :size="14" />
              <span>Ubah Bidang</span>
            </button>
            <button type="button" class="btn btn-sm btn-outline" @click="openNewProgramModal(dept.id)">
              <Plus :size="16" />
              <span>Tambah Program</span>
            </button>
            <button type="button" class="chevron-btn" @click="toggleDept(dept.id)"
              :aria-label="openDepts[dept.id] ? 'Tutup bidang' : 'Buka bidang'">
              <ChevronDown :size="20" class="chevron-icon" :class="{ 'rotate-180': openDepts[dept.id] }" />
            </button>
          </div>
        </div>

        <!-- Program List in Department -->
        <div v-show="openDepts[dept.id]" class="programs-body">
          <div v-if="!programsByDepartment[dept.id] || programsByDepartment[dept.id].length === 0"
            class="empty-program">
            Belum ada program untuk bidang ini. Klik "Tambah Program" di atas.
          </div>

          <div v-else class="programs-list">
            <div v-for="prog in programsByDepartment[dept.id]" :key="prog.id" class="program-row"
              :class="{ 'is-hidden': !prog.isVisible }">
              <div class="program-main-info">
                <div class="program-title-line">
                  <CheckCircle2 :size="18" class="check-icon" />
                  <h3 class="program-heading">{{ prog.name }}</h3>
                </div>

                <div class="activities-snippet">
                  <span class="act-label">Kegiatan:</span>
                  <span v-for="(act, idx) in prog.activities" :key="act.id" class="act-chip">
                    {{ act.name }}
                  </span>
                </div>
              </div>

              <div class="program-row-actions">
                <button type="button" class="action-icon-btn"
                  :title="prog.isVisible ? 'Sembunyikan dari publik' : 'Tampilkan ke publik'"
                  @click="toggleProgramVisibility(prog)">
                  <span class="vis-indicator" :class="prog.isVisible ? 'on' : 'off'">
                    {{ prog.isVisible ? 'Tampil' : 'Sembunyi' }}
                  </span>
                </button>

                <button type="button" class="action-icon-btn" title="Ubah Program" @click="openEditProgramModal(prog)">
                  <Edit2 :size="16" />
                </button>

                <button type="button" class="action-icon-btn danger" title="Hapus Program"
                  @click="deleteProgram(prog.id)">
                  <Trash2 :size="16" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>

    <!-- MODAL ADD / EDIT PROGRAM -->
    <div v-if="showProgramModal" class="modal-backdrop" @click.self="showProgramModal = false">
      <div class="modal-card card">
        <div class="modal-head">
          <h2>{{ editingProgram ? 'Ubah Program Kerja' : 'Tambah Program Kerja Baru' }}</h2>
          <button type="button" class="close-modal-btn" @click="showProgramModal = false">
            <X :size="20" />
          </button>
        </div>

        <div class="modal-form">
          <div class="form-group">
            <label class="form-label">Bidang Pelayanan</label>
            <select v-model="selectedDeptId" class="form-input">
              <option v-for="dept in departments" :key="dept.id" :value="dept.id">
                Bidang {{ dept.romanNumber }} — {{ dept.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Nama Program</label>
            <input v-model="programName" type="text" placeholder="Contoh: Kelengkapan Organisasi" class="form-input"
              required />
          </div>

          <div class="form-group">
            <div class="activity-head">
              <label class="form-label">Daftar Kegiatan</label>
              <button type="button" class="add-act-btn" @click="addActivityField">
                <Plus :size="14" />
                <span>Tambah Kegiatan</span>
              </button>
            </div>

            <div class="activity-fields-list">
              <div v-for="(_, index) in activityNames" :key="index" class="act-input-row">
                <input v-model="activityNames[index]" type="text" placeholder="Nama kegiatan..." class="form-input" />
                <button v-if="activityNames.length > 1" type="button" class="remove-act-btn"
                  @click="removeActivityField(index)" title="Hapus baris kegiatan">
                  <X :size="16" />
                </button>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline" @click="showProgramModal = false">
              Batal
            </button>
            <button type="button" class="btn btn-primary" @click="saveProgram">
              Simpan Program
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL ADD / EDIT DEPARTMENT -->
    <div v-if="showDeptModal" class="modal-backdrop" @click.self="showDeptModal = false">
      <div class="modal-card card">
        <div class="modal-head">
          <h2>{{ editingDept ? 'Ubah Bidang Pelayanan' : 'Tambah Bidang Baru' }}</h2>
          <button type="button" class="close-modal-btn" @click="showDeptModal = false">
            <X :size="20" />
          </button>
        </div>

        <div class="modal-form">
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Nomor Romawi</label>
              <input v-model="deptRoman" type="text" placeholder="I, II, III, IV, V..." class="form-input" required />
            </div>
            <div class="form-group">
              <label class="form-label">Kode Singkat</label>
              <input v-model="deptShortName" type="text" placeholder="OR, PI, KS..." class="form-input" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Nama Bidang</label>
            <input v-model="deptName" type="text" placeholder="Contoh: Organisasi" class="form-input" required />
          </div>

          <div class="form-group">
            <label class="form-label">Deskripsi Bidang</label>
            <textarea v-model="deptDescription" rows="3" placeholder="Ringkasan fokus pelayanan bidang ini..."
              class="form-input form-textarea"></textarea>
          </div>

          <div class="form-group photo-upload-group">
            <label class="form-label">Foto Dokumentasi Bidang Pelayanan</label>
            <div class="dept-photo-upload-box">
              <div class="dept-preview-media">
                <img
                  v-if="deptImageUrl"
                  :src="deptImageUrl"
                  alt="Pratinjau Foto Bidang"
                  class="dept-preview-img"
                />
                <div v-else class="dept-preview-empty">
                  <ImageIcon :size="28" class="empty-icon" />
                  <span>Belum ada foto bidang</span>
                </div>
              </div>

              <div class="upload-controls">
                <input
                  ref="deptFileInputRef"
                  type="file"
                  accept="image/*"
                  class="hidden-file-input"
                  @change="handleDeptPhotoSelected"
                />
                <button
                  type="button"
                  class="btn btn-sm btn-outline"
                  :disabled="isUploadingDeptPhoto"
                  @click="triggerDeptPhotoSelect"
                >
                  <UploadCloud :size="16" />
                  <span>{{ isUploadingDeptPhoto ? 'Mengunggah...' : (deptImageUrl ? 'Ganti Foto' : 'Unggah Foto') }}</span>
                </button>
                <button
                  v-if="deptImageUrl"
                  type="button"
                  class="btn btn-sm btn-ghost text-danger"
                  @click="removeDeptPhoto"
                  title="Hapus foto bidang"
                >
                  <Trash2 :size="15" />
                  <span>Hapus Foto</span>
                </button>
              </div>
            </div>

            <span v-if="deptUploadStatus" class="upload-status-text" :class="{ 'is-loading': isUploadingDeptPhoto }">
              {{ deptUploadStatus }}
            </span>
            <span v-else class="field-hint">
              Pilih foto kegiatan representatif bidang (JPG, PNG, WebP). Foto otomatis diunggah ke cloud dan path tersimpan di Neon.
            </span>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline" @click="showDeptModal = false">
              Batal
            </button>
            <button type="button" class="btn btn-primary" @click="saveDept">
              Simpan Bidang
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.programs-admin {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.admin-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.depts-stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.dept-panel {
  padding: 0;
  overflow: hidden;
}

.dept-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  cursor: pointer;
  background: var(--white);
  border-bottom: 1px solid var(--border);
  transition: background 0.2s ease;
}

.dept-bar:hover {
  background: #f8fafc;
}

.dept-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.dept-badge {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  background: var(--navy);
  color: var(--gold);
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1.15rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.dept-title {
  font-size: 1.15rem;
  margin: 0;
  color: var(--ink);
}

.dept-count {
  font-size: 0.8rem;
  color: var(--muted);
}

.dept-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.chevron-btn {
  width: 36px;
  height: 36px;
  min-width: 36px;
  min-height: 36px;
  color: var(--muted);
}

.chevron-icon {
  transition: transform 0.25s ease;
}

.rotate-180 {
  transform: rotate(180deg);
  color: var(--teal);
}

.programs-body {
  padding: var(--space-4) var(--space-5);
  background: #fafcff;
}

.empty-program {
  font-size: 0.9rem;
  color: var(--muted);
  padding: var(--space-4) 0;
  text-align: center;
}

.programs-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.program-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: 14px 18px;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

@media (min-width: 768px) {
  .program-row {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.program-row.is-hidden {
  opacity: 0.55;
  background: #f1f5f9;
}

.program-main-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.program-title-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.check-icon {
  color: var(--teal);
  flex-shrink: 0;
}

.program-heading {
  font-size: 1.05rem;
  font-family: var(--font-body);
  font-weight: 600;
  margin: 0;
  color: var(--ink);
}

.activities-snippet {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding-left: 26px;
}

.act-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
}

.act-chip {
  background: #eef5fc;
  color: #1e3a8a;
  font-size: 0.78rem;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

.program-row-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-icon-btn {
  color: var(--muted);
  width: 36px;
  height: 36px;
  min-width: 36px;
  min-height: 36px;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.action-icon-btn:hover {
  color: var(--navy);
  background: #f1f5f9;
}

.action-icon-btn.danger:hover {
  color: #ef4444;
  background: #fee2e2;
}

.vis-indicator {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: var(--radius-full);
}

.vis-indicator.on {
  background: #dcfce7;
  color: #166534;
}

.vis-indicator.off {
  background: #f1f5f9;
  color: #64748b;
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
  max-width: 540px;
  padding: var(--space-6);
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.modal-head h2 {
  font-size: 1.35rem;
  margin: 0;
}

.modal-form {
  display: flex;
  flex-direction: column;
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
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.95rem;
}

.activity-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.add-act-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  color: var(--teal);
  font-weight: 600;
  min-height: 28px;
}

.activity-fields-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.act-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.remove-act-btn {
  color: #ef4444;
  width: 36px;
  height: 36px;
  min-width: 36px;
  min-height: 36px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.82rem;
  min-height: 36px;
}

.dept-thumb-container {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--navy);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid var(--border);
}

.dept-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dept-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dept-tag-pill {
  font-size: 0.72rem;
  font-weight: 700;
  background: rgba(13, 148, 136, 0.12);
  color: var(--teal);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dept-desc-snippet {
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: normal;
  margin-left: 4px;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.form-textarea {
  resize: vertical;
  min-height: 70px;
}

.form-hint {
  font-size: 0.78rem;
  color: var(--muted);
  margin-top: 4px;
  margin-bottom: 0;
}

.dept-photo-upload-box {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: 12px;
  background: #f8fafc;
  border: 1px dashed var(--border);
  border-radius: var(--radius-sm);
  margin-top: 4px;
}

.dept-preview-media {
  width: 100%;
  height: 140px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--navy);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
}

.dept-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dept-preview-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.82rem;
}

.hidden-file-input {
  display: none;
}

.upload-controls {
  display: flex;
  align-items: center;
  gap: var(--space-2);
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
