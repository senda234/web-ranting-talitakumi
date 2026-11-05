import { PrismaClient, Role, ContentStatus, AlbumCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Memulai proses seeding data Web Ranting Talitakumi...');

  // 1. Akun Super Admin Awal (Akun web internal, bukan akun Google)
  const passwordHash = await bcrypt.hash('admin123', 10);
  const primaryEmail = 'admin@talitakumi.org';
  const adminUser = await prisma.user.upsert({
    where: { email: primaryEmail },
    update: {
      name: 'Super Admin Talitakumi',
      emailNormalized: primaryEmail.toLowerCase(),
      role: Role.SUPER_ADMIN,
      authProvider: 'LOCAL',
      status: 'ACTIVE',
      isActive: true,
      passwordHash,
    },
    create: {
      name: 'Super Admin Talitakumi',
      email: primaryEmail,
      emailNormalized: primaryEmail.toLowerCase(),
      passwordHash,
      role: Role.SUPER_ADMIN,
      authProvider: 'LOCAL',
      status: 'ACTIVE',
      isActive: true,
    },
  });
  console.log(`✅ Akun Super Admin Web Utama: ${adminUser.email} (Role: SUPER_ADMIN)`);

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
      imageUrl: 'https://res.cloudinary.com/ovukwake/image/upload/v1793782907/talitakumi/departments/vcyireyqax8gymdniqhc.jpg',
      sortOrder: 1,
    },
    {
      romanNumber: 'II',
      name: 'Pelpem dan IPTEKS',
      shortName: 'PI',
      description: 'Pelayanan pemuda, bakti sosial, dan pengembangan ilmu pengetahuan serta teknologi.',
      imageUrl: 'https://res.cloudinary.com/ovukwake/image/upload/v1793782908/talitakumi/departments/xw9zez06ih3ky231ayov.jpg',
      sortOrder: 2,
    },
    {
      romanNumber: 'III',
      name: 'Kesaksian dan Hubungan Agama-agama',
      shortName: 'KS',
      description: 'Peningkatan mutu persekutuan, ibadah rutin, koinonia, dan kerukunan.',
      imageUrl: 'https://res.cloudinary.com/ovukwake/image/upload/v1793782910/talitakumi/departments/ye9rsyt1fbgm5mw6cfws.jpg',
      sortOrder: 3,
    },
    {
      romanNumber: 'IV',
      name: 'Pekabaran Injil dan Komunikasi',
      shortName: 'KI',
      description: 'Pekabaran Injil pemuda dan optimalisasi media komunikasi digital ranting.',
      imageUrl: 'https://res.cloudinary.com/ovukwake/image/upload/v1793782911/talitakumi/departments/lb4bv4qzwqkcfkf64z5z.jpg',
      sortOrder: 4,
    },
    {
      romanNumber: 'V',
      name: 'Finansial dan Ekonomi',
      shortName: 'FE',
      description: 'Kemandirian dana pelayanan melalui usaha kreatif dan partisipasi jemaat.',
      imageUrl: 'https://res.cloudinary.com/ovukwake/image/upload/v1793782912/talitakumi/departments/qdgxent4tchtdhwygwx4.jpg',
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
      photoUrl: 'https://res.cloudinary.com/ovukwake/image/upload/v1793782885/talitakumi/officers/2024-2026/vtw581aggl1l0w43trgs.jpg',
      instagram: 'maikellobataka',
      sortOrder: 1,
    },
    {
      name: 'Jeferson Moniharapon',
      title: 'Sekretaris Ranting',
      positionKey: 'sekretaris',
      departmentId: null,
      photoUrl: 'https://res.cloudinary.com/ovukwake/image/upload/v1793782886/talitakumi/officers/2024-2026/g5m5d8ihlpb1dstu3dmg.jpg',
      instagram: 'niwderevej',
      sortOrder: 2,
    },
    {
      name: 'Sendy Soukotta',
      title: 'Bendahara Ranting',
      positionKey: 'bendahara',
      departmentId: null,
      photoUrl: 'https://res.cloudinary.com/ovukwake/image/upload/v1793782887/talitakumi/officers/2024-2026/zo21lfxboscjtv19vljg.jpg',
      instagram: 'sendysoukotta',
      sortOrder: 3,
    },
    {
      name: 'Vian Manusiwa',
      title: 'Bendahara 1',
      positionKey: 'bendahara_1',
      departmentId: null,
      photoUrl: 'https://res.cloudinary.com/ovukwake/image/upload/v1793782889/talitakumi/officers/2024-2026/jskmbfrt2clyllhm8fr0.jpg',
      instagram: 'vianmanusiwa__',
      sortOrder: 4,
    },
    {
      name: 'Valdo Lesnussa',
      title: 'Bendahara 2',
      positionKey: 'bendahara_2',
      departmentId: null,
      photoUrl: 'https://res.cloudinary.com/ovukwake/image/upload/v1793782890/talitakumi/officers/2024-2026/e3dtufq4zw5167eillku.jpg',
      instagram: 'valdolesnussa',
      sortOrder: 5,
    },

    // Bidang I
    {
      name: 'Frisenda Akerina',
      title: 'Ketua Bidang I',
      positionKey: 'bidang_1_ketua',
      departmentId: deptMap['I'],
      photoUrl: 'https://res.cloudinary.com/ovukwake/image/upload/v1793782891/talitakumi/officers/2024-2026/tz7bah1rgkfx3zoesen4.jpg',
      instagram: 'frisgrchla_',
      sortOrder: 6,
    },
    {
      name: 'Venia Lesnussa',
      title: 'Sekretaris Bidang I',
      positionKey: 'bidang_1_sekretaris',
      departmentId: deptMap['I'],
      photoUrl: 'https://res.cloudinary.com/ovukwake/image/upload/v1793782893/talitakumi/officers/2024-2026/z4ce4rntrroaunjwzbls.jpg',
      instagram: 'sendalesnussa__',
      sortOrder: 7,
    },

    // Bidang II
    {
      name: 'Kevin Urlialy',
      title: 'Ketua Bidang II',
      positionKey: 'bidang_2_ketua',
      departmentId: deptMap['II'],
      photoUrl: 'https://res.cloudinary.com/ovukwake/image/upload/v1793782894/talitakumi/officers/2024-2026/qsmcd4htwxudi8va9e7z.jpg',
      instagram: 'kurlialy',
      sortOrder: 8,
    },
    {
      name: 'Agnes Lesnussa',
      title: 'Sekretaris Bidang II',
      positionKey: 'bidang_2_sekretaris',
      departmentId: deptMap['II'],
      photoUrl: 'https://res.cloudinary.com/ovukwake/image/upload/v1793782895/talitakumi/officers/2024-2026/wnlavvi5ajc5kr0ruinc.jpg',
      instagram: 'agnespattiradjawane',
      sortOrder: 9,
    },

    // Bidang III
    {
      name: 'Prilenza Bataka',
      title: 'Ketua Bidang III',
      positionKey: 'bidang_3_ketua',
      departmentId: deptMap['III'],
      photoUrl: 'https://res.cloudinary.com/ovukwake/image/upload/v1793782896/talitakumi/officers/2024-2026/fgpuuk4ghli7i9he4ehc.jpg',
      instagram: 'prilybataka',
      sortOrder: 10,
    },
    {
      name: 'Vanessa Sohilait',
      title: 'Sekretaris Bidang III',
      positionKey: 'bidang_3_sekretaris',
      departmentId: deptMap['III'],
      photoUrl: 'https://res.cloudinary.com/ovukwake/image/upload/v1793782897/talitakumi/officers/2024-2026/qttc6goawmtqe8bwm2vk.jpg',
      instagram: 'chaeesohilait10',
      sortOrder: 11,
    },

    // Bidang IV
    {
      name: 'Erol Lesnussa',
      title: 'Ketua Bidang IV',
      positionKey: 'bidang_4_ketua',
      departmentId: deptMap['IV'],
      photoUrl: 'https://res.cloudinary.com/ovukwake/image/upload/v1793782898/talitakumi/officers/2024-2026/n2hmlqsaj0lknfyppps4.jpg',
      instagram: 'e_lesnussa',
      sortOrder: 12,
    },
    {
      name: 'Julio Lesnussa',
      title: 'Sekretaris Bidang IV',
      positionKey: 'bidang_4_sekretaris',
      departmentId: deptMap['IV'],
      photoUrl: 'https://res.cloudinary.com/ovukwake/image/upload/v1793782899/talitakumi/officers/2024-2026/pfakpprersuv7pncatx3.jpg',
      instagram: 'juliolesnussa',
      sortOrder: 13,
    },

    // Bidang V
    {
      name: 'Raisitha Manuputty',
      title: 'Ketua Bidang V',
      positionKey: 'bidang_5_ketua',
      departmentId: deptMap['V'],
      photoUrl: 'https://res.cloudinary.com/ovukwake/image/upload/v1793782904/talitakumi/officers/2024-2026/w5dlkg2uq8eayeyfcve7.jpg',
      instagram: 'sita.manuputty',
      sortOrder: 14,
    },
    {
      name: 'Glen Aponno',
      title: 'Sekretaris Bidang V',
      positionKey: 'bidang_5_sekretaris',
      departmentId: deptMap['V'],
      photoUrl: 'https://res.cloudinary.com/ovukwake/image/upload/v1793782906/talitakumi/officers/2024-2026/oevtme2hdq7euidmdwt2.jpg',
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
      coverUrl: 'https://res.cloudinary.com/ovukwake/image/upload/v1793782929/talitakumi/albums/bidang-i/lzkc1jjlojsvczbfl0xo.jpg',
      sortOrder: 1,
    },
    {
      title: 'Bidang II — Pelpem & IPTEKS',
      slug: 'bidang-ii',
      description: 'Dokumentasi kerja bakti, aksi sosial, dan pelayanan kasih pemuda Bidang II.',
      category: AlbumCategory.BIDANG,
      deptRoman: 'II',
      coverUrl: 'https://res.cloudinary.com/ovukwake/image/upload/v1793782962/talitakumi/albums/bidang-ii/xauwzextfugreamsrkun.jpg',
      sortOrder: 2,
    },
    {
      title: 'Bidang III — Kesaksian & Ibadah',
      slug: 'bidang-iii',
      description: 'Dokumentasi ibadah ranting, persekutuan, dan kebersamaan peribadatan Bidang III.',
      category: AlbumCategory.BIDANG,
      deptRoman: 'III',
      coverUrl: 'https://res.cloudinary.com/ovukwake/image/upload/v1793782998/talitakumi/albums/bidang-iii/znfnwc6fo54cem9iom61.jpg',
      sortOrder: 3,
    },
    {
      title: 'Bidang V — Finansial & Ekonomi',
      slug: 'bidang-v',
      description: 'Dokumentasi usaha dana, penjualan bazar, dan kemandirian ekonomi Bidang V.',
      category: AlbumCategory.BIDANG,
      deptRoman: 'V',
      coverUrl: 'https://res.cloudinary.com/ovukwake/image/upload/v1793783032/talitakumi/albums/bidang-v/fsfvw6rvijtlyagckffj.jpg',
      sortOrder: 4,
    },
    {
      title: 'Pniel Talent',
      slug: 'pniel-talent',
      description: 'Dokumentasi ajang bakat dan kreativitas pemuda gereja Pniel Talent.',
      category: AlbumCategory.KEGIATAN_KHUSUS,
      deptRoman: null,
      coverUrl: 'https://res.cloudinary.com/ovukwake/image/upload/v1793783043/talitakumi/albums/pniel-talent/gosbq9jqbgfxfhgucjem.jpg',
      sortOrder: 5,
    },
    {
      title: 'SBC (Study Bible Camp )',
      slug: 'sbc',
      description: 'Dokumentasi kompetisi cerdas cermat Alkitab dan kebersamaan tim SBC.',
      category: AlbumCategory.KEGIATAN_KHUSUS,
      deptRoman: null,
      coverUrl: 'https://res.cloudinary.com/ovukwake/image/upload/v1793783052/talitakumi/albums/sbc/fzjsjmdrrwarxn2qkqgj.jpg',
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

