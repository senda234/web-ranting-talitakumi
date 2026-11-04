export type Role = 'SUPER_ADMIN' | 'EDITOR';

export interface SiteSettings {
  id: string;
  organizationName: string;
  branchName: string;
  subBranchName: string; // Ranting
  slogan: string;
  verse: string; // Markus 5:41
  address: string;
  instagramUrl: string;
  instagramHandle: string;
}

export interface Department {
  id: string;
  romanNumber: string; // I, II, III, IV, V
  name: string;
  shortName: string;
  description: string;
  imageUrl?: string;
  sortOrder: number;
  isVisible: boolean;
}

export interface Officer {
  id: string;
  name: string;
  title: string; // Ketua, Sekretaris, Bendahara, etc.
  positionKey: string; // 'ketua', 'sekretaris', 'bendahara', 'bidang_1_ketua', etc.
  departmentId?: string;
  departmentName?: string;
  periodId: string;
  photoUrl?: string;
  instagram?: string;
  sortOrder: number;
  isVisible: boolean;
}

export interface LeadershipPeriod {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
  isActive: boolean;
}

export interface ProgramActivity {
  id: string;
  programId: string;
  name: string;
  description?: string;
  sortOrder: number;
}

export interface Program {
  id: string;
  departmentId: string;
  departmentName?: string;
  departmentRoman?: string;
  periodId: string;
  name: string;
  summary?: string;
  sortOrder: number;
  isVisible: boolean;
  activities: ProgramActivity[];
}

export interface TimelineItem {
  id: string;
  yearLabel: string; // e.g. "Sebelum 1980", "1980", "2024-2026"
  title: string;
  description: string;
  sortOrder: number;
  sectionId?: string;
  isVisible: boolean;
}

export interface HistorySection {
  id: string;
  periodLabel: string;
  title: string;
  content: string;
  sortOrder: number;
  status: 'DRAFT' | 'PUBLISHED';
}

export interface HistoryPageData {
  title: string;
  summary: string;
  meaning: string;
  verse: string;
  youtubeUrl?: string;
  timeline: TimelineItem[];
  sections: HistorySection[];
}

export interface MediaAsset {
  id: string;
  publicId?: string;
  url: string;
  originalFilename: string;
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
  caption?: string;
  altText?: string;
  sortOrder?: number;
}

export interface Album {
  id: string;
  title: string;
  slug: string;
  description?: string;
  category: 'BIDANG' | 'KEGIATAN_KHUSUS';
  departmentId?: string;
  departmentName?: string;
  coverUrl?: string;
  photoCount: number;
  startDate?: string;
  status: 'DRAFT' | 'PUBLISHED';
  sortOrder: number;
  photos?: MediaAsset[];
}

export interface HomeData {
  settings: SiteSettings;
  hero: {
    title: string;
    slogan: string;
    subSlogan: string;
    verse: string;
    featuredPhotoUrl?: string;
  };
  leaders: {
    ketua?: Officer;
    sekretaris?: Officer;
    bendahara?: Officer;
    periodName: string;
  };
  departments: Department[];
  recentPhotos: MediaAsset[];
}

