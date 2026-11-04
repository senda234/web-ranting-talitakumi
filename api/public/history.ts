import type { IncomingMessage, ServerResponse } from 'http';
import prisma from '../_lib/prisma';
import { sendSuccess, sendError } from '../_lib/response';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET') {
    return sendError(res, 405, 'Metode tidak diizinkan');
  }

  try {
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
  } catch (err: any) {
    return sendError(res, 500, 'Gagal memuat data sejarah', err.message);
  }
}

