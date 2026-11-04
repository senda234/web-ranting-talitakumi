import type { IncomingMessage, ServerResponse } from 'http';
import prisma from '../_lib/prisma';
import { sendSuccess, sendError } from '../_lib/response';

/**
 * Consolidated Public API Endpoint:
 * Handles /api/public/albums, /api/public/programs, /api/public/officers, /api/public/history, and /api/public/home
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET') {
    return sendError(res, 405, 'Metode tidak diizinkan');
  }

  const url = new URL(req.url || '', 'http://localhost');
  const resource = url.pathname.split('/').filter(Boolean).pop();

  try {
    // 1. ALBUMS
    if (resource === 'albums') {
      const albums = await prisma.album.findMany({
        where: {
          status: 'PUBLISHED',
          deletedAt: null,
        },
        include: {
          department: true,
          _count: {
            select: { albumMedia: true },
          },
        },
        orderBy: { sortOrder: 'asc' },
      });
      return sendSuccess(res, albums);
    }

    // 2. PROGRAMS
    if (resource === 'programs') {
      const departments = await prisma.department.findMany({
        where: { isVisible: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          programs: {
            where: { isVisible: true, deletedAt: null },
            orderBy: { sortOrder: 'asc' },
            include: {
              activities: {
                orderBy: { sortOrder: 'asc' },
              },
            },
          },
        },
      });
      return sendSuccess(res, departments);
    }

    // 3. OFFICERS
    if (resource === 'officers') {
      const activePeriod = await prisma.leadershipPeriod.findFirst({
        where: { isActive: true },
        include: {
          officers: {
            where: { isVisible: true },
            include: { department: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
      });

      if (!activePeriod) {
        return sendSuccess(res, { period: null, officers: [] });
      }

      return sendSuccess(res, {
        period: {
          id: activePeriod.id,
          name: activePeriod.name,
          startYear: activePeriod.startYear,
          endYear: activePeriod.endYear,
        },
        officers: activePeriod.officers,
      });
    }

    // 4. HISTORY
    if (resource === 'history') {
      const [pageData, timeline, sections] = await Promise.all([
        prisma.historyPage.findFirst(),
        prisma.timelineItem.findMany({
          where: { isVisible: true },
          orderBy: { sortOrder: 'asc' },
        }),
        prisma.historySection.findMany({
          where: { status: 'PUBLISHED', deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        }),
      ]);

      return sendSuccess(res, {
        title: pageData?.title || 'Perjalanan Pelayanan Ranting Talitakumi',
        summary:
          pageData?.summary ||
          'Kisah panjang tentang kesetiaan melayani, pergantian generasi, dan panggilan yang terus berkobar: “Hai, anak muda, bangkitlah!”',
        meaning:
          pageData?.meaning ||
          'Talitakumi adalah frasa dalam bahasa Aram yang diucapkan Tuhan Yesus ketika membangkitkan anak perempuan Yairus, dengan arti: “Hai, anak muda, bangkitlah!”',
        verse: pageData?.verse || 'Markus 5:41',
        youtubeUrl: pageData?.youtubeUrl || 'https://www.youtube.com/embed/DKGd0s9SHHo?si=wYHE0dhCsS4ivps3',
        timeline,
        sections,
      });
    }

    // 5. HOME
    if (resource === 'home') {
      const [settings, activePeriod, departments] = await Promise.all([
        prisma.siteSetting.findFirst(),
        prisma.leadershipPeriod.findFirst({
          where: { isActive: true },
          include: {
            officers: {
              where: {
                isVisible: true,
                positionKey: { in: ['ketua', 'sekretaris', 'bendahara'] },
              },
              orderBy: { sortOrder: 'asc' },
            },
          },
        }),
        prisma.department.findMany({
          where: { isVisible: true },
          orderBy: { sortOrder: 'asc' },
        }),
      ]);

      return sendSuccess(res, {
        settings: settings || {
          organizationName: 'Angkatan Muda Gereja Protestan Maluku',
          branchName: 'Cabang Pniel',
          subBranchName: 'Ranting Talitakumi',
          slogan: 'Talita Kum, Hai Anak Muda Bangkitlah',
          verse: 'Markus 5:41',
          address: 'Jln. Listrik Negara Batu Gajah Atas, Ambon',
          instagramUrl: 'https://instagram.com/ranting.talitakumi',
          instagramHandle: 'ranting.talitakumi',
        },
        hero: {
          title: settings?.organizationName || 'AMGPM Cabang Pniel',
          slogan: settings?.slogan || 'Talita Kum, Hai Anak Muda Bangkitlah',
          subSlogan: 'Ranting Talitakumi — Berjalan dalam iman, bertumbuh dalam pelayanan, dan melayani jemaat dengan kasih.',
          verse: settings?.verse || 'Markus 5:41',
        },
        activePeriod: activePeriod
          ? {
              id: activePeriod.id,
              name: activePeriod.name,
              startYear: activePeriod.startYear,
              endYear: activePeriod.endYear,
            }
          : null,
        departments,
      });
    }

    return sendError(res, 404, 'Resource publik tidak ditemukan');
  } catch (err: any) {
    return sendError(res, 500, `Gagal memuat data resource: ${resource}`, err.message);
  }
}

