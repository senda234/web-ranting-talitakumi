import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('--- PEMERIKSAAN KONEKSI & STRUKTUR NEON POSTGRESQL ---');
  console.log('Database URL Host:', process.env.DATABASE_URL?.split('@')[1]?.split('/')[0]);

  const [depts, officersCount, programsCount, albumsCount, mediaCount, settings] = await Promise.all([
    prisma.department.findMany({
      select: { romanNumber: true, name: true, imageUrl: true },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.officer.count(),
    prisma.program.count(),
    prisma.album.count(),
    prisma.mediaAsset.count(),
    prisma.siteSetting.findFirst(),
  ]);

  console.log('\n1. Site Settings di Neon:');
  console.log('   Organisasi:', settings?.organizationName);
  console.log('   Slogan:', settings?.slogan);

  console.log('\n2. Bidang & Path Foto di Neon:');
  depts.forEach((d) => {
    console.log(`   Bidang ${d.romanNumber} (${d.name}) => Path/URL: ${d.imageUrl}`);
  });

  console.log('\n3. Rekap Data di Neon PostgreSQL:');
  console.log(`   - Pengurus: ${officersCount} orang (path foto di kolom photo_url)`);
  console.log(`   - Program Kerja: ${programsCount} program`);
  console.log(`   - Album Galeri: ${albumsCount} album (cover path di kolom cover_url)`);
  console.log(`   - Media Assets: ${mediaCount} foto (path Cloudinary di kolom secure_url)`);
}

main()
  .catch((e) => console.error('Error koneksi Neon:', e))
  .finally(() => prisma.$disconnect());

