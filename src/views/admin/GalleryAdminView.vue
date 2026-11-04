<script setup lang="ts">
import { ref, computed } from 'vue';
import { useContentStore } from '@/stores/content';
import {
  Plus,
  Images,
  UploadCloud,
  Check,
  Eye,
  Trash2,
  Star,
  X,
  FileImage,
  Edit2,
} from 'lucide-vue-next';
import type { Album } from '@/types';
import type { ArchivePhotoItem } from '@/data/albumPhotos';

const contentStore = useContentStore();
const albums = computed(() => contentStore.albums);

const selectedAlbum = ref<Album | null>(albums.value[0] || null);
const albumPhotos = ref<ArchivePhotoItem[]>([]);

function selectAlbum(album: Album) {
  selectedAlbum.value = album;
  const detailed = contentStore.getAlbumBySlug(album.slug);
  albumPhotos.value = detailed ? [...detailed.photos] : [];
}

// Initialize with first album
if (selectedAlbum.value) {
  selectAlbum(selectedAlbum.value);
}

// Edit Album Modal State
const showEditAlbumModal = ref(false);
const editTitle = ref('');
const editCategory = ref<'BIDANG' | 'KEGIATAN_KHUSUS'>('BIDANG');
const editDescription = ref('');
const isSavingAlbum = ref(false);

function openEditAlbumModal() {
  if (!selectedAlbum.value) return;
  editTitle.value = selectedAlbum.value.title;
  editCategory.value = selectedAlbum.value.category;
  editDescription.value = selectedAlbum.value.description || '';
  showEditAlbumModal.value = true;
}

async function saveAlbumEdit() {
  if (!selectedAlbum.value || !editTitle.value.trim()) return;

  isSavingAlbum.value = true;
  const newTitle = editTitle.value.trim();
  const newCategory = editCategory.value;
  const newDesc = editDescription.value.trim();

  // 1. Perbarui state lokal Pinia
  selectedAlbum.value.title = newTitle;
  selectedAlbum.value.category = newCategory;
  selectedAlbum.value.description = newDesc;

  contentStore.updateAlbum(selectedAlbum.value.id, {
    title: newTitle,
    category: newCategory,
    description: newDesc,
  });

  // 2. Simpan ke database Neon PostgreSQL
  try {
    await fetch('/api/admin/albums', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selectedAlbum.value.id,
        slug: selectedAlbum.value.slug,
        title: newTitle,
        category: newCategory,
        description: newDesc,
      }),
    });
  } catch (err) {
    console.warn('Gagal sinkronisasi pembaruan album ke Neon:', err);
  } finally {
    isSavingAlbum.value = false;
    showEditAlbumModal.value = false;
  }
}

// Album creation modal
const showNewAlbumModal = ref(false);
const newTitle = ref('');
const newCategory = ref<'BIDANG' | 'KEGIATAN_KHUSUS'>('BIDANG');
const newDescription = ref('');

function createNewAlbum() {
  if (!newTitle.value.trim()) return;

  const slug = newTitle.value
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');

  const createdAlbum: Album = {
    id: `alb-${Date.now()}`,
    title: newTitle.value,
    slug,
    description: newDescription.value,
    category: newCategory.value,
    photoCount: 0,
    status: 'DRAFT',
    sortOrder: albums.value.length + 1,
  };

  contentStore.albums.push(createdAlbum);
  selectAlbum(createdAlbum);
  showNewAlbumModal.value = false;
  newTitle.value = '';
  newDescription.value = '';
}

// Toggle publication status
function togglePublish(album: Album) {
  album.status = album.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
}

// Set photo as cover
function setAsCover(photoUrl: string) {
  if (selectedAlbum.value) {
    selectedAlbum.value.coverUrl = photoUrl;
  }
}

// Real upload to Cloudinary with metadata persistence in Neon PostgreSQL
const isUploading = ref(false);
const uploadProgress = ref(0);
const uploadNotice = ref('');

async function handleFileUpload(e: Event) {
  const input = e.target as HTMLInputElement;
  if (!input.files || input.files.length === 0 || !selectedAlbum.value) return;

  const files = Array.from(input.files);
  isUploading.value = true;
  uploadProgress.value = 10;
  uploadNotice.value = 'Mempersiapkan tanda tangan upload...';

  try {
    // 1. Dapatkan signature upload dari endpoint backend
    let signData: any = null;
    try {
      const sigRes = await fetch('/api/admin/cloudinary/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: `talitakumi/albums/${selectedAlbum.value.slug}` }),
      });
      if (sigRes.ok) {
        const json = await sigRes.json();
        signData = json.data;
      }
    } catch {
      // Backend not running in standalone client mode
    }

    let completed = 0;
    for (const file of files) {
      let photoUrl = URL.createObjectURL(file);
      let cloudinaryPublicId: string | null = null;
      let width: number | null = null;
      let height: number | null = null;
      let format: string | null = null;
      let bytes: number = file.size;

      // 2. Jika signature tersedia, kirim file langsung ke Cloudinary (hanya sebagai media storage)
      if (signData) {
        uploadNotice.value = `Mengunggah ${file.name} ke Cloudinary...`;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', signData.apiKey);
        formData.append('timestamp', signData.timestamp.toString());
        formData.append('signature', signData.signature);
        formData.append('folder', signData.folder);

        try {
          const cldRes = await fetch(
            `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`,
            { method: 'POST', body: formData }
          );

          if (cldRes.ok) {
            const cldJson = await cldRes.json();
            photoUrl = cldJson.secure_url; // Path Cloudinary yang akan disimpan ke Neon
            cloudinaryPublicId = cldJson.public_id;
            width = cldJson.width;
            height = cldJson.height;
            format = cldJson.format;
            bytes = cldJson.bytes;

            // 3. Simpan path gambar dan metadata Cloudinary ke Neon PostgreSQL
            uploadNotice.value = `Menyimpan path ${file.name} ke database Neon...`;
            await fetch('/api/admin/media', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                cloudinaryPublicId,
                secureUrl: photoUrl,
                originalFilename: file.name,
                format,
                bytes,
                width,
                height,
                caption: '',
                altText: `Foto kegiatan ${selectedAlbum.value.title}`,
                albumId: selectedAlbum.value.id,
              }),
            });
          }
        } catch (cldErr) {
          console.warn('Gagal upload ke Cloudinary, fallback ke object URL:', cldErr);
        }
      }

      // Tambahkan ke state frontend
      const newPhoto: ArchivePhotoItem = {
        id: `photo-${Date.now()}-${completed}`,
        albumSlug: selectedAlbum.value.slug,
        filename: file.name,
        originalFilename: file.name,
        url: photoUrl,
        altText: `Foto kegiatan ${selectedAlbum.value.title}`,
      };
      albumPhotos.value.unshift(newPhoto);

      if (!selectedAlbum.value.coverUrl) {
        selectedAlbum.value.coverUrl = photoUrl;
      }

      completed++;
      uploadProgress.value = Math.round((completed / files.length) * 100);
    }

    selectedAlbum.value.photoCount = albumPhotos.value.length;
    uploadNotice.value = 'Upload selesai!';
    setTimeout(() => {
      uploadNotice.value = '';
    }, 2000);
  } finally {
    isUploading.value = false;
    input.value = '';
  }
}
</script>

<template>
  <div class="gallery-admin">
    <div class="admin-page-header">
      <div>
        <h1 class="page-title">Pengelolaan Galeri & Album</h1>
        <p class="page-desc">Kelola album dokumentasi kegiatan dan unggah foto dokumentasi.</p>
      </div>
      <button type="button" class="btn btn-primary" @click="showNewAlbumModal = true">
        <Plus :size="18" />
        <span>Buat Album Baru</span>
      </button>
    </div>

    <!-- MAIN TWO-COLUMN WORKSPACE -->
    <div class="gallery-workspace">
      <!-- LEFT: ALBUM LIST -->
      <aside class="album-sidebar card">
        <h2 class="sidebar-title">Daftar Album ({{ albums.length }})</h2>
        <div class="album-list">
          <div
            v-for="alb in albums"
            :key="alb.id"
            class="album-nav-item"
            :class="{ 'is-selected': selectedAlbum?.id === alb.id }"
            @click="selectAlbum(alb)"
            role="button"
            tabindex="0"
          >
            <div class="album-nav-thumb">
              <img v-if="alb.coverUrl" :src="alb.coverUrl" :alt="alb.title" />
              <Images v-else :size="20" class="no-thumb-icon" />
            </div>

            <div class="album-nav-info">
              <h3 class="album-nav-name">{{ alb.title }}</h3>
              <div class="album-nav-meta">
                <span>{{ alb.photoCount }} Foto</span>
                <span
                  class="status-dot"
                  :class="alb.status === 'PUBLISHED' ? 'published' : 'draft'"
                  :title="alb.status === 'PUBLISHED' ? 'Terbit' : 'Draf'"
                ></span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- RIGHT: SELECTED ALBUM DETAIL & PHOTOS -->
      <section v-if="selectedAlbum" class="album-editor card">
        <div class="editor-header">
          <div class="header-left">
            <div class="album-badge-row">
              <span class="badge" :class="selectedAlbum.category === 'BIDANG' ? 'badge-teal' : 'badge-gold'">
                {{ selectedAlbum.category === 'BIDANG' ? 'Bidang Pelayanan' : 'Kegiatan Khusus' }}
              </span>
              <button
                type="button"
                class="btn btn-sm btn-ghost edit-title-btn"
                @click="openEditAlbumModal"
                title="Ubah nama dan deskripsi album"
              >
                <Edit2 :size="14" />
                <span>Ubah Nama Album</span>
              </button>
            </div>
            <h2 class="selected-title">{{ selectedAlbum.title }}</h2>
            <p v-if="selectedAlbum.description" class="selected-desc">{{ selectedAlbum.description }}</p>
          </div>

          <div class="header-actions">
            <button
              type="button"
              class="btn btn-outline"
              @click="openEditAlbumModal"
              title="Sunting judul dan rincian album"
            >
              <Edit2 :size="16" />
              <span>Edit Info</span>
            </button>
            <button
              type="button"
              class="btn"
              :class="selectedAlbum.status === 'PUBLISHED' ? 'btn-outline' : 'btn-primary'"
              @click="togglePublish(selectedAlbum)"
            >
              <Check v-if="selectedAlbum.status === 'PUBLISHED'" :size="16" />
              <Eye v-else :size="16" />
              <span>{{ selectedAlbum.status === 'PUBLISHED' ? 'Telah Terbit' : 'Terbitkan Album' }}</span>
            </button>
          </div>
        </div>

        <!-- UPLOAD DROPZONE -->
        <div class="upload-dropzone">
          <UploadCloud :size="36" class="upload-icon" />
          <div class="drop-text">
            <strong>Pilih atau seret foto ke area ini</strong>
            <span>Mendukung file JPG, PNG, WebP (maks. 20 foto per antrean)</span>
          </div>
          <input
            type="file"
            multiple
            accept="image/*"
            class="hidden-input"
            @change="handleFileUpload"
          />
        </div>

        <div v-if="isUploading" class="upload-progress-bar">
          <div class="progress-fill" :style="{ width: `${uploadProgress}%` }"></div>
          <span class="progress-label">{{ uploadNotice || 'Mengunggah foto...' }} {{ uploadProgress }}%</span>
        </div>

        <!-- PHOTOS GRID -->
        <div class="photos-management-wrap">
          <div class="photos-header">
            <h3>Foto di Album Ini ({{ albumPhotos.length }})</h3>
            <span class="hint-text">Ketuk ikon bintang pada foto untuk menjadikannya sampul album.</span>
          </div>

          <div v-if="albumPhotos.length === 0" class="empty-photos">
            <FileImage :size="48" class="empty-icon" />
            <p>Belum ada foto di album ini. Unggah foto pertama di atas.</p>
          </div>

          <div v-else class="photos-grid">
            <div
              v-for="photo in albumPhotos"
              :key="photo.id"
              class="photo-manage-card"
            >
              <img :src="photo.url" :alt="photo.altText" loading="lazy" />

              <!-- Overlay Toolbar -->
              <div class="photo-tools">
                <button
                  type="button"
                  class="tool-btn star-btn"
                  :class="{ 'is-cover': selectedAlbum.coverUrl === photo.url }"
                  @click="setAsCover(photo.url)"
                  title="Jadikan Sampul"
                >
                  <Star :size="16" />
                </button>
              </div>

              <div class="photo-info-bar">
                <span class="photo-name">{{ photo.filename }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- CREATE ALBUM MODAL -->
    <div v-if="showNewAlbumModal" class="modal-backdrop" @click.self="showNewAlbumModal = false">
      <div class="modal-card card">
        <div class="modal-head">
          <h2>Buat Album Baru</h2>
          <button type="button" class="close-modal-btn" @click="showNewAlbumModal = false">
            <X :size="20" />
          </button>
        </div>

        <div class="modal-form">
          <div class="form-group">
            <label class="form-label">Nama Album</label>
            <input
              v-model="newTitle"
              type="text"
              placeholder="Contoh: Rapat Kerja Pemuda 2026"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Kategori</label>
            <select v-model="newCategory" class="form-input">
              <option value="BIDANG">Bidang Pelayanan</option>
              <option value="KEGIATAN_KHUSUS">Kegiatan Khusus / Partisipasi</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Deskripsi Singkat</label>
            <textarea
              v-model="newDescription"
              rows="3"
              placeholder="Keterangan singkat mengenai dokumentasi album..."
              class="form-input"
            ></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline" @click="showNewAlbumModal = false">
              Batal
            </button>
            <button type="button" class="btn btn-primary" @click="createNewAlbum">
              Simpan Album
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- EDIT ALBUM MODAL -->
    <div v-if="showEditAlbumModal && selectedAlbum" class="modal-backdrop" @click.self="showEditAlbumModal = false">
      <div class="modal-card card">
        <div class="modal-head">
          <div>
            <span class="badge badge-teal">Galeri & Album</span>
            <h2>Ubah Nama & Info Album</h2>
          </div>
          <button type="button" class="close-modal-btn" @click="showEditAlbumModal = false">
            <X :size="20" />
          </button>
        </div>

        <div class="modal-form">
          <div class="form-group">
            <label class="form-label">Nama Galeri / Judul Album</label>
            <input
              v-model="editTitle"
              type="text"
              placeholder="Contoh: Bidang I — Organisasi"
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">Kategori Album</label>
            <select v-model="editCategory" class="form-input">
              <option value="BIDANG">Bidang Pelayanan</option>
              <option value="KEGIATAN_KHUSUS">Kegiatan Khusus / Partisipasi / Acara</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Deskripsi Singkat</label>
            <textarea
              v-model="editDescription"
              rows="3"
              placeholder="Keterangan singkat mengenai dokumentasi album..."
              class="form-input form-textarea"
            ></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline" @click="showEditAlbumModal = false">
              Batal
            </button>
            <button
              type="button"
              class="btn btn-primary"
              :disabled="isSavingAlbum"
              @click="saveAlbumEdit"
            >
              <Check :size="16" />
              <span>{{ isSavingAlbum ? 'Menyimpan...' : 'Simpan Perubahan' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gallery-admin {
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

/* WORKSPACE */
.gallery-workspace {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-5);
}

@media (min-width: 900px) {
  .gallery-workspace {
    grid-template-columns: 320px 1fr;
    align-items: start;
  }
}

.album-sidebar {
  padding: var(--space-4);
}

.sidebar-title {
  font-size: 1.15rem;
  margin-bottom: var(--space-3);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--border);
}

.album-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-height: 580px;
  overflow-y: auto;
}

.album-nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.album-nav-item:hover {
  background: #f8fafc;
}

.album-nav-item.is-selected {
  background: #eef5fb;
  border-color: #cbd5e1;
}

.album-nav-thumb {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-sm);
  background: var(--navy);
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.album-nav-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-thumb-icon {
  color: var(--white);
}

.album-nav-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.album-nav-name {
  font-size: 0.92rem;
  font-family: var(--font-body);
  font-weight: 600;
  margin: 0;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.album-nav-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  color: var(--muted);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.published {
  background: #16a34a;
}

.status-dot.draft {
  background: #eab308;
}

/* EDITOR SECTION */
.album-editor {
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.editor-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--border);
}

@media (min-width: 680px) {
  .editor-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
  }
}

.selected-title {
  font-size: 1.5rem;
  margin: 6px 0 2px;
}

.selected-desc {
  font-size: 0.9rem;
  color: var(--muted);
}

/* DROPZONE */
.upload-dropzone {
  position: relative;
  border: 2px dashed #94a3b8;
  border-radius: var(--radius);
  padding: var(--space-6);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.2s ease;
}

.upload-dropzone:hover {
  border-color: var(--teal);
  background: #f0fdfa;
}

.upload-icon {
  color: var(--teal);
}

.drop-text strong {
  display: block;
  font-size: 0.95rem;
  color: var(--ink);
}

.drop-text span {
  font-size: 0.8rem;
  color: var(--muted);
}

.hidden-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  width: 100%;
  height: 100%;
}

.upload-progress-bar {
  background: #e2e8f0;
  border-radius: var(--radius-full);
  height: 24px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
}

.progress-fill {
  background: var(--teal);
  height: 100%;
  transition: width 0.3s ease;
}

.progress-label {
  position: absolute;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--white);
}

/* PHOTOS GRID */
.photos-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: var(--space-4);
}

.hint-text {
  font-size: 0.8rem;
  color: var(--muted);
}

.empty-photos {
  text-align: center;
  padding: var(--space-8);
  color: var(--muted);
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}

@media (min-width: 600px) {
  .photos-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 900px) {
  .photos-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.photo-manage-card {
  position: relative;
  aspect-ratio: 1/1;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--navy);
  box-shadow: var(--shadow-sm);
}

.photo-manage-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-tools {
  position: absolute;
  top: 6px;
  right: 6px;
  display: flex;
  gap: 4px;
}

.tool-btn {
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.65);
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.tool-btn.star-btn.is-cover {
  background: var(--gold);
  color: var(--ink);
}

.photo-info-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.75);
  padding: 4px 8px;
}

.photo-name {
  font-size: 0.7rem;
  color: var(--white);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
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

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.album-badge-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.edit-title-btn {
  font-size: 0.78rem;
  padding: 3px 8px;
  min-height: 28px;
  color: var(--teal);
}

.edit-title-btn:hover {
  background: rgba(15, 118, 110, 0.08);
}

.form-textarea {
  resize: vertical;
  min-height: 75px;
}
</style>

