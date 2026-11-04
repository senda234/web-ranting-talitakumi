import { v2 as cloudinary } from 'cloudinary';
import { PrismaClient, AlbumCategory, ContentStatus } from '@prisma/client';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadFileToCloudinary(filePath: string, folder: string) {
  return cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: 'auto',
  });
}

async function runMigration() {
  console.log('🚀 Memulai migrasi foto lokal ke Cloudinary dan Neon PostgreSQL...');
  console.log('Cloudinary Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);

  const baseDir = path.resolve(process.cwd(), 'public/foto');
  if (!fs.existsSync(baseDir)) {
    console.error('❌ Folder public/foto tidak ditemukan!');
    return;
  }

  // 1. Migrasi Foto Hero Latar Belakang
  const heroPath = path.join(baseDir, 'backround.jpg');
  if (fs.existsSync(heroPath)) {
    console.log('\n📸 Mengunggah Foto Hero (backround.jpg)...');
    try {
      const heroRes = await uploadFileToCloudinary(heroPath, 'talitakumi/site/hero');
      console.log('✅ Hero terunggah:', heroRes.secure_url);

      await prisma.mediaAsset.create({
        data: {
          cloudinaryPublicId: heroRes.public_id,
          secureUrl: heroRes.secure_url,
          originalFilename: 'backround.jpg',
          format: heroRes.format,
          bytes: heroRes.bytes,
          width: heroRes.width,
          height: heroRes.height,
          caption: 'Foto Hero Latar Belakang Talitakumi',
        },
      });
    } catch (e: any) {
      console.error('⚠️ Gagal unggah hero:', e.message || e);
    }
  }

  // 2. Migrasi Foto Pengurus Aktif (15 Pengurus)
  console.log('\n👥 Mengunggah Foto 15 Pengurus Ranting...');
  const officers = await prisma.officer.findMany({
    orderBy: { sortOrder: 'asc' },
  });

  for (const off of officers) {
    if (!off.photoUrl) continue;

    // e.g. "/foto/def7b385-f3c0-448a-a38a-07eb314078ab.jpeg" -> local path
    const filename = path.basename(off.photoUrl);
    const localPhotoPath = path.join(baseDir, filename);

    if (fs.existsSync(localPhotoPath)) {
      try {
        console.log(`Mengunggah foto [${off.title}] ${off.name} (${filename})...`);
        const res = await uploadFileToCloudinary(
          localPhotoPath,
          'talitakumi/officers/2024-2026'
        );

        // Update database with real Cloudinary URL
        await prisma.officer.update({
          where: { id: off.id },
          data: { photoUrl: res.secure_url },
        });

        // Simpan ke media_assets
        await prisma.mediaAsset.create({
          data: {
            cloudinaryPublicId: res.public_id,
            secureUrl: res.secure_url,
            originalFilename: filename,
            format: res.format,
            bytes: res.bytes,
            width: res.width,
            height: res.height,
            caption: `Foto Pengurus: ${off.name} (${off.title})`,
          },
        });

        console.log(`✅ Berhasil: ${res.secure_url}`);
      } catch (err: any) {
        console.error(`⚠️ Gagal unggah foto pengurus ${off.name}:`, err.message || err);
      }
    } else {
      console.warn(`File lokal tidak ditemukan: ${localPhotoPath}`);
    }
  }

  // 3. Migrasi Foto Lima Bidang Pelayanan
  console.log('\n🏛️ Mengunggah Foto 5 Bidang Pelayanan...');
  const departments = await prisma.department.findMany({
    orderBy: { sortOrder: 'asc' },
  });

  for (const dept of departments) {
    if (!dept.imageUrl) continue;
    const filename = path.basename(dept.imageUrl);
    const localDeptPhotoPath = path.join(baseDir, 'bidang', filename);

    if (fs.existsSync(localDeptPhotoPath)) {
      try {
        console.log(`Mengunggah foto Bidang ${dept.romanNumber} - ${dept.name} (${filename})...`);
        const res = await uploadFileToCloudinary(
          localDeptPhotoPath,
          'talitakumi/departments'
        );

        // Update Neon database with Cloudinary URL
        await prisma.department.update({
          where: { id: dept.id },
          data: { imageUrl: res.secure_url },
        });

        // Simpan metadata ke media_assets di Neon
        await prisma.mediaAsset.create({
          data: {
            cloudinaryPublicId: res.public_id,
            secureUrl: res.secure_url,
            originalFilename: filename,
            format: res.format,
            bytes: res.bytes,
            width: res.width,
            height: res.height,
            caption: `Foto Bidang ${dept.romanNumber}: ${dept.name}`,
          },
        });

        console.log(`✅ Berhasil diperbarui di Neon: ${res.secure_url}`);
      } catch (err: any) {
        console.error(`⚠️ Gagal unggah foto bidang ${dept.romanNumber}:`, err.message || err);
      }
    }
  }

  // 4. Migrasi Album dan Foto Dokumentasi
  console.log('\n📁 Mengunggah Foto Album Dokumentasi...');
  const albumFolders = [
    { slug: 'bidang-i', folderName: 'Bidang I' },
    { slug: 'bidang-ii', folderName: 'Bidang II' },
    { slug: 'bidang-iii', folderName: 'Bidang III' },
    { slug: 'bidang-v', folderName: 'Bidang V' },
    { slug: 'pniel-talent', folderName: 'Pniel Talent' },
    { slug: 'sbc', folderName: 'SBC' },
  ];

  for (const item of albumFolders) {
    const albumRecord = await prisma.album.findUnique({
      where: { slug: item.slug },
    });
    if (!albumRecord) continue;

    const folderPath = path.join(baseDir, item.folderName);
    if (!fs.existsSync(folderPath)) continue;

    const files = fs
      .readdirSync(folderPath)
      .filter((f) => /\.(jpe?g|png|webp)$/i.test(f)); // Saring RAW .CR2

    console.log(`\nAlbum [${albumRecord.title}]: ditemukan ${files.length} berkas foto.`);

    let sortOrder = 1;
    let coverUrl = albumRecord.coverUrl;

    for (const file of files) {
      const fullPath = path.join(folderPath, file);
      try {
        console.log(`  Unggah: ${file}...`);
        const res = await uploadFileToCloudinary(
          fullPath,
          `talitakumi/albums/${item.slug}`
        );

        // Jika foto pertama dan album belum punya sampul Cloudinary
        if (sortOrder === 1 || !coverUrl?.startsWith('http')) {
          coverUrl = res.secure_url;
        }

        // Simpan media asset
        const media = await prisma.mediaAsset.create({
          data: {
            cloudinaryPublicId: res.public_id,
            secureUrl: res.secure_url,
            originalFilename: file,
            format: res.format,
            bytes: res.bytes,
            width: res.width,
            height: res.height,
            caption: `Dokumentasi ${albumRecord.title}`,
          },
        });

        // Hubungkan ke album_media
        await prisma.albumMedia.create({
          data: {
            albumId: albumRecord.id,
            mediaId: media.id,
            sortOrder,
          },
        });

        sortOrder++;
      } catch (err: any) {
        console.error(`  ⚠️ Gagal unggah ${file}:`, err.message || err);
      }
    }

    // Perbarui album cover URL di database
    if (coverUrl) {
      await prisma.album.update({
        where: { id: albumRecord.id },
        data: { coverUrl },
      });
    }
  }

  console.log('\n🎉 Selesai memproses seluruh direktori!');
}

runMigration()
  .catch((e) => console.error('Error migrasi:', e))
  .finally(() => prisma.$disconnect());

