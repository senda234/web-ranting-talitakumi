import { PrismaClient, Role, ContentStatus, AlbumCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Memulai proses seeding data Web Ranting Talitakumi...');

  // 1. Akun Super Admin Awal
  const passwordHash = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@talitakumi.org' },
    update: {},
    create: {
      name: 'Super Admin Talitakumi',
      email: 'admin@talitakumi.org',
      passwordHash,
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
  });
  console.log(`✅ Akun Admin: ${adminUser.email}`);

  // 2. Pengaturan Situs (Site Settings)
  const existingSettings = await prisma.siteSetting.findFirst();
  if (!existingSettings) {
    await prisma.siteSetting.create({
      data: {
        organizationName: 'Angkatan Muda Gereja Protestan Maluku',
        branchName: 'Cabang Pniel',
        subBranchName: 'Ranting Talitakumi',
        slogan: 'Talita Kum, Hai Anak Muda Bangkitlah',
        verse: 'Markus 5:41',
        address: 'Jln. Listrik Negara Batu Gajah Atas, Ambon',
        instagramUrl: 'https://instagram.com/ranting.talitakumi',
        instagramHandle: 'ranting.talitakumi',
      },
    });
    console.log('✅ Pengaturan situs berhasil dibuat.');
  }

  // 3. Lima Bidang Pelayanan
  const departmentsData = [
    {
      romanNumber: 'I',
      name: 'Organisasi',
      shortName: 'OR',
      description: 'Pemberdayaan struktur, database anggota, dan kelengkapan organisasi.',
      imageUrl: '/foto/bidang/bidang-1-organisasi.png',
      sortOrder: 1,
    },
    {
      romanNumber: 'II',
      name: 'Pelpem dan IPTEKS',
      shortName: 'PI',
      description: 'Pelayanan pemuda, bakti sosial, dan pengembangan ilmu pengetahuan serta teknologi.',
      imageUrl: '/foto/bidang/bidang-2-pelpem.jpg',
      sortOrder: 2,
    },
    {
      romanNumber: 'III',
      name: 'Kesaksian dan Hubungan Agama-agama',
      shortName: 'KS',
      description: 'Peningkatan mutu persekutuan, ibadah rutin, koinonia, dan kerukunan.',
      imageUrl: '/foto/bidang/bidang-3-kesaksian.png',
      sortOrder: 3,
    },
    {
      romanNumber: 'IV',
      name: 'Pekabaran Injil dan Komunikasi',
      shortName: 'KI',
      description: 'Pekabaran Injil pemuda dan optimalisasi media komunikasi digital ranting.',
      imageUrl: '/foto/bidang/bidang-4-peka-injil.jpg',
      sortOrder: 4,
    },
    {
      romanNumber: 'V',
      name: 'Finansial dan Ekonomi',
      shortName: 'FE',
      description: 'Kemandirian dana pelayanan melalui usaha kreatif dan partisipasi jemaat.',
      imageUrl: '/foto/bidang/bidang-5-finansial.jpg',
      sortOrder: 5,
    },
  ];

  const deptMap: Record<string, string> = {};
  for (const dept of departmentsData) {
    const existing = await prisma.department.findFirst({
      where: { romanNumber: dept.romanNumber },
    });
    if (existing) {
      await prisma.department.update({
        where: { id: existing.id },
        data: {
          name: dept.name,
          shortName: dept.shortName,
          description: dept.description,
          imageUrl: dept.imageUrl,
          sortOrder: dept.sortOrder,
        },
      });
      deptMap[dept.romanNumber] = existing.id;
    } else {
      const created = await prisma.department.create({
        data: {
          romanNumber: dept.romanNumber,
          name: dept.name,
          shortName: dept.shortName,
          description: dept.description,
          imageUrl: dept.imageUrl,
          sortOrder: dept.sortOrder,
          isVisible: true,
        },
      });
      deptMap[dept.romanNumber] = created.id;
    }
  }
  console.log('✅ Lima bidang pelayanan terdaftar.');

  // 4. Periode Kepengurusan 2024–2026
  let period = await prisma.leadershipPeriod.findFirst({
    where: { startYear: 2024, endYear: 2026 },
  });
  if (!period) {
    period = await prisma.leadershipPeriod.create({
      data: {
        name: 'Periode 2024–2026',
        startYear: 2024,
        endYear: 2026,
        isActive: true,
      },
    });
  }
  console.log(`✅ Periode aktif: ${period.name}`);

  // 5. Susunan 15 Pengurus
  const officersData = [
    {
      name: 'Michael Bataka',
      title: 'Ketua Ranting',
      positionKey: 'ketua',
      departmentId: null,
      photoUrl: '/foto/def7b385-f3c0-448a-a38a-07eb314078ab.jpeg',
      instagram: 'maikellobataka',
      sortOrder: 1,
    },
    {
      name: 'Jeferson Moniharapon',
      title: 'Sekretaris Ranting',
      positionKey: 'sekretaris',
      departmentId: null,
      photoUrl: '/foto/d195e568-352e-4be5-b40d-2685fcebb344.jpeg',
      instagram: 'niwderevej',
      sortOrder: 2,
    },
    {
      name: 'Sendy Soukotta',
      title: 'Bendahara Ranting',
      positionKey: 'bendahara',
      departmentId: null,
      photoUrl: '/foto/c8c3192f-118a-41e4-897e-31449ec8213f.jpeg',
      instagram: 'sendysoukotta',
      sortOrder: 3,
    },
    {
      name: 'Vian Manusiwa',
      title: 'Bendahara 1',
      positionKey: 'bendahara_1',
      departmentId: null,
      photoUrl: '/foto/bf767758-14b3-4e76-b651-c942009722e9.jpeg',
      instagram: 'vianmanusiwa__',
      sortOrder: 4,
    },
    {
      name: 'Valdo Lesnussa',
      title: 'Bendahara 2',
      positionKey: 'bendahara_2',
      departmentId: null,
      photoUrl: '/foto/644c9dd2-8671-465b-a157-91fd0a449307.jpeg',
      instagram: 'valdolesnussa',
      sortOrder: 5,
    },

    // Bidang I
    {
      name: 'Frisenda Akerina',
      title: 'Ketua Bidang I',
      positionKey: 'bidang_1_ketua',
      departmentId: deptMap['I'],
      photoUrl: '/foto/70365359-a851-4784-99a8-b68907c09945.jpeg',
      instagram: 'frisgrchla_',
      sortOrder: 6,
    },
    {
      name: 'Venia Lesnussa',
      title: 'Sekretaris Bidang I',
      positionKey: 'bidang_1_sekretaris',
      departmentId: deptMap['I'],
      photoUrl: '/foto/4e4494a2-f114-4f06-a2b2-dc357fe0d6bd.jpeg',
      instagram: 'sendalesnussa__',
      sortOrder: 7,
    },

    // Bidang II
    {
      name: 'Kevin Urlialy',
      title: 'Ketua Bidang II',
      positionKey: 'bidang_2_ketua',
      departmentId: deptMap['II'],
      photoUrl: '/foto/354e0684-bad6-479a-9fd8-f74e3d8e8bdb.jpeg',
      instagram: 'kurlialy',
      sortOrder: 8,
    },
    {
      name: 'Agnes Lesnussa',
      title: 'Sekretaris Bidang II',
      positionKey: 'bidang_2_sekretaris',
      departmentId: deptMap['II'],
      photoUrl: '/foto/8d33bd63-0d0d-4be7-a664-ff2b87cde645.jpeg',
      instagram: 'agnespattiradjawane',
      sortOrder: 9,
    },

    // Bidang III
    {
      name: 'Prilenza Bataka',
      title: 'Ketua Bidang III',
      positionKey: 'bidang_3_ketua',
      departmentId: deptMap['III'],
      photoUrl: '/foto/ketua_bidang_III.jpeg',
      instagram: 'prilybataka',
      sortOrder: 10,
    },
    {
      name: 'Vanessa Sohilait',
      title: 'Sekretaris Bidang III',
      positionKey: 'bidang_3_sekretaris',
      departmentId: deptMap['III'],
      photoUrl: '/foto/3f6f0534-862a-4ac8-98dc-582df0836dcd.jpeg',
      instagram: 'chaeesohilait10',
      sortOrder: 11,
    },

    // Bidang IV
    {
      name: 'Erol Lesnussa',
      title: 'Ketua Bidang IV',
      positionKey: 'bidang_4_ketua',
      departmentId: deptMap['IV'],
      photoUrl: '/foto/ebd8192b-7ca8-49c8-b652-4115695f9d1d.jpeg',
      instagram: 'e_lesnussa',
      sortOrder: 12,
    },
    {
      name: 'Julio Lesnussa',
      title: 'Sekretaris Bidang IV',
      positionKey: 'bidang_4_sekretaris',
      departmentId: deptMap['IV'],
      photoUrl: '/foto/3d41e5b2-88e2-4c59-ac6b-f2e842330848.jpeg',
      instagram: 'juliolesnussa',
      sortOrder: 13,
    },

    // Bidang V
    {
      name: 'Raisitha Manuputty',
      title: 'Ketua Bidang V',
      positionKey: 'bidang_5_ketua',
      departmentId: deptMap['V'],
      photoUrl: '/foto/8bf79b1f-8d7e-4e14-a0a3-d4dd882e2781.jpeg',
      instagram: 'sita.manuputty',
      sortOrder: 14,
    },
    {
      name: 'Glen Aponno',
      title: 'Sekretaris Bidang V',
      positionKey: 'bidang_5_sekretaris',
      departmentId: deptMap['V'],
      photoUrl: '/foto/c0b5f188-6d6b-4968-9be9-a3e5cb16a3bf.jpeg',
      instagram: 'glenaponno_',
      sortOrder: 15,
    },
  ];

  for (const off of officersData) {
    const existing = await prisma.officer.findFirst({
      where: {
        periodId: period.id,
        positionKey: off.positionKey,
      },
    });

    if (!existing) {
      await prisma.officer.create({
        data: {
          periodId: period.id,
          name: off.name,
          title: off.title,
          positionKey: off.positionKey,
          departmentId: off.departmentId,
          photoUrl: off.photoUrl,
          instagram: off.instagram,
          sortOrder: off.sortOrder,
          isVisible: true,
        },
      });
    }
  }
  console.log('✅ Susunan 15 pengurus terdaftar.');

  // 6. Program Kerja & Kegiatan Lima Bidang
  const programsData = [
    {
      deptRoman: 'I',
      name: 'Kelengkapan Organisasi',
      sortOrder: 1,
      activities: ['Pemeliharaan dan Perawatan Gedung Sekretariat'],
    },
    {
      deptRoman: 'I',
      name: 'Database Ranting',
      sortOrder: 2,
      activities: ['Pendataan Anggota'],
    },
    {
      deptRoman: 'I',
      name: 'Peningkatan Koordinasi dan Rapat Koordinasi',
      sortOrder: 3,
      activities: ['Rapat Ranting XV dan Rapat Pengurus'],
    },
    {
      deptRoman: 'I',
      name: 'HUT AMGPM Ranting Talitakumi',
      sortOrder: 4,
      activities: ['HUT Ranting Talitakumi'],
    },
    {
      deptRoman: 'II',
      name: 'Bakti Sosial',
      sortOrder: 1,
      activities: ['Kerja Bakti'],
    },
    {
      deptRoman: 'II',
      name: 'Peningkatan Pola Pelayanan yang Berdasarkan Firman Tuhan',
      sortOrder: 2,
      activities: [
        'Pelayanan bagi Anggota dan Pengurus yang Tidak Aktif, Pelayanan Duka, Pelayanan Sakit, Pelayanan Bahagia, dan Pelayanan Kasih',
      ],
    },
    {
      deptRoman: 'III',
      name: 'Peningkatan Persekutuan dan Peningkatan Mutu Ibadah',
      sortOrder: 1,
      activities: ['Ibadah Ranting, Koinonia ke Luar, dan Natal Ranting'],
    },
    {
      deptRoman: 'IV',
      name: 'Peningkatan Kesadaran Pemuda terhadap Pekabaran Injil',
      sortOrder: 1,
      activities: ['Sehari Berkorban untuk PI'],
    },
    {
      deptRoman: 'IV',
      name: 'Pengadaan Informasi Rutin Ranting',
      sortOrder: 2,
      activities: ['Pemanfaatan Media Sosial'],
    },
    {
      deptRoman: 'V',
      name: 'Kemandirian Dana',
      sortOrder: 1,
      activities: [
        'Penjualan Dana, Penawaran Jasa, Sehari Berkorban Syukur HUT, Pesta Santa Claus, Badendang, dan Lotrei',
      ],
    },
  ];

  for (const prog of programsData) {
    const departmentId = deptMap[prog.deptRoman];
    if (!departmentId) continue;

    let program = await prisma.program.findFirst({
      where: {
        departmentId,
        periodId: period.id,
        name: prog.name,
      },
    });

    if (!program) {
      program = await prisma.program.create({
        data: {
          departmentId,
          periodId: period.id,
          name: prog.name,
          sortOrder: prog.sortOrder,
          isVisible: true,
        },
      });

      for (let i = 0; i < prog.activities.length; i++) {
        await prisma.programActivity.create({
          data: {
            programId: program.id,
            name: prog.activities[i],
            sortOrder: i + 1,
          },
        });
      }
    }
  }
  console.log('✅ Sepuluh program kerja dan kegiatan terdaftar.');

  // 7. Sejarah & Garis Waktu
  const existingHistory = await prisma.historyPage.findFirst();
  if (!existingHistory) {
    await prisma.historyPage.create({
      data: {
        title: 'Perjalanan Pelayanan Ranting Talitakumi',
        summary:
          'Kisah panjang tentang kesetiaan melayani, pergantian generasi, dan panggilan yang terus berkobar: “Hai, anak muda, bangkitlah!”',
        meaning:
          'Talitakumi adalah frasa dalam bahasa Aram yang diucapkan Tuhan Yesus ketika membangkitkan anak perempuan Yairus, dengan arti: “Hai, anak muda, bangkitlah!”',
        verse: 'Markus 5:41',
        youtubeUrl: 'https://www.youtube.com/embed/DKGd0s9SHHo?si=wYHE0dhCsS4ivps3',
        status: ContentStatus.PUBLISHED,
      },
    });
  }

  // 8. Album Galeri Awal
  const albumsData = [
    {
      title: 'Bidang I — Organisasi',
      slug: 'bidang-i',
      description: 'Dokumentasi kegiatan dan koordinasi Bidang I Organisasi Ranting Talitakumi.',
      category: AlbumCategory.BIDANG,
      deptRoman: 'I',
      coverUrl: '/foto/Bidang I/IMG-20250917-WA0240.jpg',
      sortOrder: 1,
    },
    {
      title: 'Bidang II — Pelpem & IPTEKS',
      slug: 'bidang-ii',
      description: 'Dokumentasi kerja bakti, aksi sosial, dan pelayanan kasih pemuda Bidang II.',
      category: AlbumCategory.BIDANG,
      deptRoman: 'II',
      coverUrl: '/foto/Bidang II/IMG-20260517-WA0023.jpg',
      sortOrder: 2,
    },
    {
      title: 'Bidang III — Kesaksian & Ibadah',
      slug: 'bidang-iii',
      description: 'Dokumentasi ibadah ranting, persekutuan, dan kebersamaan peribadatan Bidang III.',
      category: AlbumCategory.BIDANG,
      deptRoman: 'III',
      coverUrl: '/foto/Bidang III/IMG-20251220-WA0118.jpg',
      sortOrder: 3,
    },
    {
      title: 'Bidang V — Finansial & Ekonomi',
      slug: 'bidang-v',
      description: 'Dokumentasi usaha dana, penjualan bazar, dan kemandirian ekonomi Bidang V.',
      category: AlbumCategory.BIDANG,
      deptRoman: 'V',
      coverUrl: '/foto/Bidang V/IMG-20260517-WA0066.jpg',
      sortOrder: 4,
    },
    {
      title: 'Pniel Talent',
      slug: 'pniel-talent',
      description: 'Dokumentasi ajang bakat dan kreativitas pemuda gereja Pniel Talent.',
      category: AlbumCategory.KEGIATAN_KHUSUS,
      deptRoman: null,
      coverUrl: '/foto/Pniel Talent/IMG-20251205-WA0282.jpg',
      sortOrder: 5,
    },
    {
      title: 'SBC (Smart Bible Competition)',
      slug: 'sbc',
      description: 'Dokumentasi kompetisi cerdas cermat Alkitab dan kebersamaan tim SBC.',
      category: AlbumCategory.KEGIATAN_KHUSUS,
      deptRoman: null,
      coverUrl: '/foto/SBC/IMG_20251018_190613.jpg',
      sortOrder: 6,
    },
  ];

  for (const alb of albumsData) {
    const existing = await prisma.album.findUnique({ where: { slug: alb.slug } });
    if (!existing) {
      await prisma.album.create({
        data: {
          title: alb.title,
          slug: alb.slug,
          description: alb.description,
          category: alb.category,
          departmentId: alb.deptRoman ? deptMap[alb.deptRoman] : null,
          coverUrl: alb.coverUrl,
          sortOrder: alb.sortOrder,
          status: ContentStatus.PUBLISHED,
          publishedAt: new Date(),
        },
      });
    }
  }
  console.log('✅ Album galeri terbit terdaftar.');
  console.log('🎉 Seeding selesai dengan sukses!');
}

main()
  .catch((e) => {
    console.error('❌ Error saat seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

