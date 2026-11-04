import type { IncomingMessage, ServerResponse } from 'http';
import prisma from '../_lib/prisma';
import { sendSuccess, sendError } from '../_lib/response';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET') {
    return sendError(res, 405, 'Metode tidak diizinkan');
  }

  try {
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

    const ketua = activePeriod?.officers.find((o) => o.positionKey === 'ketua');
    const sekretaris = activePeriod?.officers.find((o) => o.positionKey === 'sekretaris');
    const bendahara = activePeriod?.officers.find((o) => o.positionKey === 'bendahara');

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
        featuredPhotoUrl: '/foto/backround.jpg',
      },
      leaders: {
        ketua,
        sekretaris,
        bendahara,
        periodName: activePeriod?.name || 'Periode 2024–2026',
      },
      departments,
    });
  } catch (err: any) {
    return sendError(res, 500, 'Gagal memuat data beranda', err.message);
  }
}

