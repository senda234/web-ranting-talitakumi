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

export const useContentStore = defineStore('content', () => {
  const settings = ref<SiteSettings>(initialSiteSettings);
  const activePeriod = ref<LeadershipPeriod>(initialPeriod);
  const departments = ref<Department[]>(initialDepartments);
  const officers = ref<Officer[]>(initialOfficers);
  const programs = ref<Program[]>(initialPrograms);
  const historyData = ref<HistoryPageData>(initialHistoryData);
  const albums = ref<Album[]>(initialAlbums);
  const homeData = ref<HomeData>(initialHomeData);

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
      map[dept.id] = visibleOfficers.value.filter((o) => o.departmentId === dept.id);
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
    const alb = albums.value.find((a) => a.slug === slug);
    if (!alb) return null;
    const photos = getAlbumPhotos(slug);
    return {
      ...alb,
      photos,
      photoCount: photos.length,
    };
  }

  function addDepartment(newDept: Omit<Department, 'id'>): Department {
    const dept: Department = {
      ...newDept,
      id: `dept-${Date.now()}`,
    };
    departments.value.push(dept);
    return dept;
  }

  function updateDepartment(id: string, updates: Partial<Department>) {
    const idx = departments.value.findIndex((d) => d.id === id);
    if (idx !== -1) {
      departments.value[idx] = {
        ...departments.value[idx],
        ...updates,
      };
    }
  }

  function updateAlbum(idOrSlug: string, updates: Partial<Album>) {
    const idx = albums.value.findIndex((a) => a.id === idOrSlug || a.slug === idOrSlug);
    if (idx !== -1) {
      albums.value[idx] = {
        ...albums.value[idx],
        ...updates,
      };
    }
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
    addDepartment,
    updateDepartment,
    updateAlbum,
  };
});

