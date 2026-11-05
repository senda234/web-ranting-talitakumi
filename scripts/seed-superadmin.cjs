require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to Neon PostgreSQL database...');
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('ERROR: DATABASE_URL is not defined in environment variables.');
    process.exit(1);
  }

  try {
    const host = new URL(dbUrl).host;
    console.log('Neon DB Host:', host);
  } catch {
    console.log('Using configured DATABASE_URL connection.');
  }

  const passwordPlain = 'admin123';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(passwordPlain, salt);

  const email = 'admin@talitakumi.org';
  const normalizedEmail = email.toLowerCase().trim();

  // Upsert Super Admin
  const user = await prisma.user.upsert({
    where: { email: normalizedEmail },
    update: {
      name: 'Super Admin Talitakumi',
      emailNormalized: normalizedEmail,
      passwordHash: passwordHash,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      isActive: true,
      authProvider: 'LOCAL',
      passwordChangedAt: new Date(),
    },
    create: {
      name: 'Super Admin Talitakumi',
      email: normalizedEmail,
      emailNormalized: normalizedEmail,
      passwordHash: passwordHash,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      isActive: true,
      authProvider: 'LOCAL',
      passwordChangedAt: new Date(),
    },
  });

  console.log('✅ Berhasil memastikan akun Super Admin di Neon PostgreSQL:');
  console.log({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    isActive: user.isActive,
    authProvider: user.authProvider,
  });

  // Verifikasi hash password
  const verified = await bcrypt.compare(passwordPlain, user.passwordHash);
  console.log('✅ Verifikasi kata sandi ("admin123"):', verified ? 'VALID (COCOK)' : 'GAGAL');
}

main()
  .catch((err) => {
    console.error('❌ Terjadi kesalahan saat seed Super Admin:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

