import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  SiteSettings,
  Department,
  Officer,
  LeadershipPeriod,
  Program,
  HistoryPageData,
  Album,
  HomeData,
} from '@/types';
import {
  initialSiteSettings,
  initialPeriod,
  initialDepartments,
  initialOfficers,
  initialPrograms,
  initialHistoryData,
  initialAlbums,
  initialHomeData,
} from '@/data/initialData';
import { getAlbumPhotos, type ArchivePhotoItem } from '@/data/albumPhotos';

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(`talitakumi_${key}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return fallback;
}

function saveToStorage<T>(key: string, data: T) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`talitakumi_${key}`, JSON.stringify(data));
  } catch {
    // ignore quota error
  }
}

export const useContentStore = defineStore('content', () => {
  const settings = ref<SiteSettings>(loadFromStorage('settings', initialSiteSettings));
  const activePeriod = ref<LeadershipPeriod>(loadFromStorage('activePeriod', initialPeriod));
  const departments = ref<Department[]>(loadFromStorage('departments', initialDepartments));
  const officers = ref<Officer[]>(loadFromStorage('officers', initialOfficers));
  const programs = ref<Program[]>(loadFromStorage('programs', initialPrograms));
  const historyData = ref<HistoryPageData>(loadFromStorage('historyData', initialHistoryData));
  const albums = ref<Album[]>(loadFromStorage('albums', initialAlbums));
  const homeData = ref<HomeData>(loadFromStorage('homeData', initialHomeData));

  // Computed filters
  const visibleOfficers = computed(() =>
    officers.value.filter((o) => o.isVisible).sort((a, b) => a.sortOrder - b.sortOrder)
  );

  const coreLeaders = computed(() => {
    return {
      ketua: visibleOfficers.value.find((o) => o.positionKey === 'ketua'),
      sekretaris: visibleOfficers.value.find((o) => o.positionKey === 'sekretaris'),
      bendahara: visibleOfficers.value.find((o) => o.positionKey === 'bendahara'),
      bendahara1: visibleOfficers.value.find((o) => o.positionKey === 'bendahara_1'),
      bendahara2: visibleOfficers.value.find((o) => o.positionKey === 'bendahara_2'),
    };
  });

  const departmentOfficers = computed(() => {
    const map: Record<string, Officer[]> = {};
    for (const dept of departments.value) {
      map[dept.id] = visibleOfficers.value.filter(
        (o) => o.departmentId === dept.id || (o.positionKey && o.positionKey.startsWith(`bidang_${dept.romanNumber.toLowerCase()}_`))
      );
    }
    return map;
  });

  const visibleDepartments = computed(() =>
    departments.value.filter((d) => d.isVisible).sort((a, b) => a.sortOrder - b.sortOrder)
  );

  const visiblePrograms = computed(() =>
    programs.value.filter((p) => p.isVisible).sort((a, b) => a.sortOrder - b.sortOrder)
  );

  const programsByDepartment = computed(() => {
    const map: Record<string, Program[]> = {};
    for (const dept of departments.value) {
      map[dept.id] = visiblePrograms.value.filter((p) => p.departmentId === dept.id);
    }
    return map;
  });

  const publishedAlbums = computed(() =>
    albums.value
      .filter((a) => a.status === 'PUBLISHED')
      .sort((a, b) => a.sortOrder - b.sortOrder)
  );

  function getAlbumBySlug(slug: string): (Album & { photos: ArchivePhotoItem[] }) | null {
    const alb = albums.value.find((a) => a.slug === slug || a.id === slug);
    if (!alb) return null;
    const basePhotos = getAlbumPhotos(slug);

    let customPhotos: ArchivePhotoItem[] = [];
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`talitakumi_photos_${slug}`);
        if (raw) customPhotos = JSON.parse(raw);
      } catch {
        // ignore
      }
    }

    const allPhotos = [...customPhotos, ...basePhotos];
    return {
      ...alb,
      photos: allPhotos,
      photoCount: allPhotos.length,
    };
  }

  function addAlbumPhoto(slug: string, photo: ArchivePhotoItem) {
    if (typeof window === 'undefined') return;
    try {
      const key = `talitakumi_photos_${slug}`;
      const raw = localStorage.getItem(key);
      const existing: ArchivePhotoItem[] = raw ? JSON.parse(raw) : [];
      existing.unshift(photo);
      localStorage.setItem(key, JSON.stringify(existing));

      // Also update album photoCount
      const alb = albums.value.find((a) => a.slug === slug || a.id === slug);
      if (alb) {
        alb.photoCount = (alb.photoCount || 0) + 1;
        saveToStorage('albums', albums.value);
      }
    } catch {
      // ignore
    }
  }

  function updateOfficer(idOrKey: string, updates: Partial<Officer>) {
    const idx = officers.value.findIndex(
      (o) => o.id === idOrKey || o.positionKey === idOrKey
    );
    if (idx !== -1) {
      officers.value[idx] = {
        ...officers.value[idx],
        ...updates,
      };
      saveToStorage('officers', officers.value);
    }
  }

  function addDepartment(newDept: Omit<Department, 'id'>): Department {
    const dept: Department = {
      ...newDept,
      id: `dept-${Date.now()}`,
    };
    departments.value.push(dept);
    saveToStorage('departments', departments.value);
    return dept;
  }

  function updateDepartment(idOrRoman: string, updates: Partial<Department>) {
    const idx = departments.value.findIndex(
      (d) => d.id === idOrRoman || d.romanNumber === idOrRoman
    );
    if (idx !== -1) {
      departments.value[idx] = {
        ...departments.value[idx],
        ...updates,
      };
      saveToStorage('departments', departments.value);
    }
  }

  function updateAlbum(idOrSlug: string, updates: Partial<Album>) {
    const idx = albums.value.findIndex((a) => a.id === idOrSlug || a.slug === idOrSlug);
    if (idx !== -1) {
      albums.value[idx] = {
        ...albums.value[idx],
        ...updates,
      };
      saveToStorage('albums', albums.value);
    }
  }

  function saveSettings(updates: Partial<SiteSettings>) {
    settings.value = { ...settings.value, ...updates };
    saveToStorage('settings', settings.value);
  }

  function saveHomeData(updates: Partial<HomeData>) {
    homeData.value = { ...homeData.value, ...updates };
    saveToStorage('homeData', homeData.value);
  }

  function saveHistoryData(updates: Partial<HistoryPageData>) {
    historyData.value = { ...historyData.value, ...updates };
    saveToStorage('historyData', historyData.value);
  }

  // Hydrate from production API if available (non-blocking)
  async function fetchPublicData() {
    try {
      const [resOff, resProg, resAlb] = await Promise.allSettled([
        fetch('/api/public/officers').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/public/programs').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/public/albums').then((r) => (r.ok ? r.json() : null)),
      ]);

      if (resOff.status === 'fulfilled' && resOff.value?.data?.officers?.length) {
        const dbOfficers: any[] = resOff.value.data.officers;
        officers.value = officers.value.map((localOff) => {
          const match = dbOfficers.find(
            (o) => o.positionKey === localOff.positionKey || o.id === localOff.id
          );
          return match
            ? {
                ...localOff,
                ...match,
                photoUrl: match.photoUrl || localOff.photoUrl,
              }
            : localOff;
        });
        saveToStorage('officers', officers.value);
      }

      if (resProg.status === 'fulfilled' && resProg.value?.data?.length) {
        const dbDepts: any[] = resProg.value.data;
        departments.value = departments.value.map((localDept) => {
          const match = dbDepts.find(
            (d) => d.romanNumber === localDept.romanNumber || d.id === localDept.id
          );
          return match
            ? {
                ...localDept,
                ...match,
                imageUrl: match.imageUrl || localDept.imageUrl,
              }
            : localDept;
        });
        saveToStorage('departments', departments.value);
      }

      if (resAlb.status === 'fulfilled' && resAlb.value?.data?.length) {
        const dbAlbums: any[] = resAlb.value.data;
        albums.value = albums.value.map((localAlb) => {
          const match = dbAlbums.find(
            (a) => a.slug === localAlb.slug || a.id === localAlb.id
          );
          return match
            ? {
                ...localAlb,
                ...match,
                coverUrl: match.coverUrl || localAlb.coverUrl,
              }
            : localAlb;
        });
        saveToStorage('albums', albums.value);
      }
    } catch {
      // Offline fallback
    }
  }

  // Auto initialize on load in browser
  if (typeof window !== 'undefined') {
    fetchPublicData();
  }

  return {
    settings,
    activePeriod,
    departments,
    officers,
    programs,
    historyData,
    albums,
    homeData,
    visibleOfficers,
    coreLeaders,
    departmentOfficers,
    visibleDepartments,
    visiblePrograms,
    programsByDepartment,
    publishedAlbums,
    getAlbumBySlug,
    addAlbumPhoto,
    addDepartment,
    updateDepartment,
    updateAlbum,
    updateOfficer,
    saveSettings,
    saveHomeData,
    saveHistoryData,
    fetchPublicData,
  };
});
