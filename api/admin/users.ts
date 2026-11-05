import type { IncomingMessage, ServerResponse } from 'http';
import bcrypt from 'bcryptjs';
import prisma from '../_lib/prisma';
import { getSession } from '../_lib/auth';
import { parseJsonBody } from '../_lib/body';
import { sendSuccess, sendError } from '../_lib/response';
import {
  setSecurityHeaders,
  getClientInfo,
  generateSecureToken,
  hashToken,
  ensureNotLastSuperAdmin,
  revokeAllUserSessions,
  logSecurityEvent,
  sendSystemEmail,
} from '../_lib/security';
import {
  templateInvitation,
  templateRoleChanged,
  templateAccountDisabled,
} from '../_lib/email-templates';

/**
 * Endpoint Pengelolaan Pengguna Admin & Undangan
 * Hak Akses: Super Admin & Admin
 * Karakteristik: Akun SUPER_ADMIN tidak akan muncul pada tabel pengguna.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  setSecurityHeaders(res);

  const session = await getSession(req);
  if (!session) {
    return sendError(res, 401, 'Akses ditolak: autentikasi diperlukan');
  }

  // Otorisasi: Hanya SUPER_ADMIN dan ADMIN yang berwenang
  if (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN') {
    return sendError(res, 403, 'Akses ditolak: Anda tidak memiliki izin untuk mengelola pengguna');
  }

  const method = req.method;
  const { ip, userAgent } = getClientInfo(req);
  const appUrl = process.env.APP_URL || `http://${req.headers.host || 'localhost:5173'}`;

  try {
    // 1. GET: Ambil daftar seluruh user (kecuali SUPER_ADMIN) atau ambil URL undangan
    if (method === 'GET') {
      const urlParams = new URL(req.url || '', `http://${req.headers.host}`).searchParams;
      const action = urlParams.get('action');

      // Ambil / buat URL undangan aktif untuk user tertentu (jika status dinonaktifkan atau belum aktif)
      if (action === 'invite_url' || action === 'get_invite_url') {
        const userId = urlParams.get('userId');
        if (!userId) {
          return sendError(res, 400, 'User ID wajib disertakan');
        }

        const targetUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!targetUser) {
          return sendError(res, 404, 'Pengguna tidak ditemukan');
        }

        if (targetUser.role === 'SUPER_ADMIN') {
          return sendError(res, 403, 'Aksi ditolak pada akun Super Admin');
        }

        const rawToken = generateSecureToken();
        const tokenHash = hashToken(rawToken);
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 jam

        // Bersihkan undangan lama yang belum digunakan untuk email ini
        await prisma.adminInvitation.deleteMany({
          where: { email: targetUser.email, isUsed: false },
        });

        // Buat record undangan baru
        await prisma.adminInvitation.create({
          data: {
            email: targetUser.email,
            name: targetUser.name,
            role: targetUser.role,
            tokenHash,
            expiresAt,
            createdById: session.userId,
            sendAttempts: 0,
          },
        });

        const activationUrl = `${appUrl}/admin/aktivasi?token=${rawToken}`;
        return sendSuccess(
          res,
          {
            userId: targetUser.id,
            name: targetUser.name,
            email: targetUser.email,
            status: targetUser.status,
            activationUrl,
            expiresAt,
          },
          'Tautan undangan berhasil didapatkan'
        );
      }

      const users = await prisma.user.findMany({
        where: {
          role: { not: 'SUPER_ADMIN' }, // SUPER_ADMIN tidak muncul pada tabel user
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          permissions: true,
          status: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          disabledReason: true,
          _count: {
            select: { sessions: true },
          },
        },
      });

      // Ambil juga undangan yang masih pending (kecuali SUPER_ADMIN)
      const pendingInvitations = await prisma.adminInvitation.findMany({
        where: {
          isUsed: false,
          expiresAt: { gt: new Date() },
          role: { not: 'SUPER_ADMIN' },
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          expiresAt: true,
          createdAt: true,
        },
      });

      return sendSuccess(res, {
        users: users.map((u) => ({
          ...u,
          activeSessionsCount: u._count.sessions,
        })),
        pendingInvitations,
      });
    }

    // 2. POST: Buat akun baru & hasilkan tautan undangan aktivasi satu kali
    if (method === 'POST') {
      const body = await parseJsonBody(req);
      const { name, email, role = 'EDITOR', permissions = [] } = body;

      if (!name || !email) {
        return sendError(res, 400, 'Nama dan alamat email pengguna wajib diisi');
      }

      // Validasi hak pembuatan peran:
      // Superadmin hanya lewat seeder (tidak boleh dibuat via API)
      if (role === 'SUPER_ADMIN') {
        return sendError(res, 400, 'Akun Super Admin hanya dapat ditambahkan melalui database seeder');
      }

      // Hanya Super Admin yang berwenang mengundang peran ADMIN
      if (role === 'ADMIN' && session.role !== 'SUPER_ADMIN') {
        return sendError(res, 403, 'Hanya Super Admin yang berwenang mengundang pengguna ber-peran Admin');
      }

      const targetRole = role === 'ADMIN' ? 'ADMIN' : 'EDITOR';
      const normalizedEmail = email.trim().toLowerCase();

      // Validasi bahwa email yang didaftarkan adalah akun Google yang sah
      // agar terhindar dari email palsu atau acak yang tidak jelas asalnya
      const isGoogleEmail = normalizedEmail.endsWith('@gmail.com') || normalizedEmail.endsWith('@talitakumi.org');
      if (!isGoogleEmail) {
        return sendError(
          res,
          400,
          'Email pengguna harus merupakan akun Google resmi (@gmail.com) agar keaslian akun terverifikasi saat login.'
        );
      }

      // Cek apakah email sudah terdaftar
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        return sendError(res, 400, 'Alamat email ini sudah terdaftar dalam sistem');
      }

      const rawInvitationToken = generateSecureToken();
      const tokenHash = hashToken(rawInvitationToken);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 jam

      // Tetapkan perizinan default jika Editor
      const assignedPermissions = targetRole === 'EDITOR'
        ? (Array.isArray(permissions) && permissions.length > 0 ? permissions : ['gallery', 'officers', 'programs', 'pages'])
        : [];

      // Simpan User & Invitation dalam satu transaksi database
      const result = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            name: name.trim(),
            email: normalizedEmail,
            emailNormalized: normalizedEmail,
            role: targetRole,
            permissions: assignedPermissions,
            authProvider: 'LOCAL',
            status: 'PENDING_ACTIVATION',
            isActive: false,
            passwordHash: null,
          },
        });

        const invitation = await tx.adminInvitation.create({
          data: {
            email: normalizedEmail,
            name: name.trim(),
            role: targetRole,
            tokenHash,
            expiresAt,
            createdById: session.userId,
            sendAttempts: 0,
          },
        });

        return { newUser, invitation };
      });

      const activationUrl = `${appUrl}/admin/aktivasi?token=${rawInvitationToken}`;

      // Otomatis kirim undangan via Gmail API jika terhubung
      const emailResult = await sendSystemEmail({
        to: normalizedEmail,
        ...templateInvitation({
          name: name.trim(),
          email: normalizedEmail,
          role: targetRole,
          inviteUrl: activationUrl,
          invitedByName: session.email,
        }),
      }).catch((err) => ({ success: false, error: err.message }));

      if (emailResult.success) {
        await prisma.adminInvitation.update({
          where: { id: result.invitation.id },
          data: { sentAt: new Date(), sendAttempts: 1 },
        });
      }

      await logSecurityEvent({
        eventType: 'USER_INVITATION_CREATED',
        severity: 'INFO',
        actorEmail: session.email,
        ipAddress: ip,
        userAgent,
        details: `Mengundang pengguna baru: ${normalizedEmail} sebagai ${targetRole} oleh ${session.role}. Status email: ${emailResult.success ? 'Terkirim via Gmail API' : 'Belum terkirim (manual link)'}`,
      });

      return sendSuccess(
        res,
        {
          user: result.newUser,
          activationUrl,
          expiresAt,
          emailSent: emailResult.success,
          emailError: emailResult.error || null,
        },
        emailResult.success
          ? `Undangan berhasil dikirim ke ${normalizedEmail} via Gmail.`
          : `Akun dibuat. Tautan undangan dapat dibagikan langsung secara manual.`
      );
    }

    // 3. PATCH: Ubah profil (nama, email, password), peran (role), perizinan halaman (permissions), atau status akun
    if (method === 'PATCH') {
      const body = await parseJsonBody(req);
      const { id, name, email, password, role, permissions, status, disabledReason } = body;

      if (!id) {
        return sendError(res, 400, 'ID pengguna wajib disertakan');
      }

      const targetUser = await prisma.user.findUnique({ where: { id } });
      if (!targetUser) {
        return sendError(res, 404, 'Pengguna tidak ditemukan');
      }

      // Akun Super Admin tidak boleh dimodifikasi dari antarmuka ini
      if (targetUser.role === 'SUPER_ADMIN') {
        return sendError(res, 403, 'Akun Super Admin tidak dapat diubah melalui antarmuka ini');
      }

      // Aturan untuk peran ADMIN:
      // Admin hanya berwenang mengatur profil EDITOR (termasuk kata sandinya, nama, izin, status)
      // Admin TIDAK boleh mengedit sesama Admin
      if (session.role === 'ADMIN') {
        if (targetUser.role === 'ADMIN' && id !== session.userId) {
          return sendError(res, 403, 'Admin hanya berwenang mengelola profil pengguna Editor');
        }
        if (role && role !== targetUser.role) {
          return sendError(res, 403, 'Hanya Super Admin yang berwenang mengubah peran pengguna');
        }
        if (email && email.trim().toLowerCase() !== targetUser.email) {
          return sendError(res, 403, 'Hanya Super Admin yang berwenang mengubah alamat email pengguna lain');
        }
      }

      // Pengguna tidak boleh menurunkan perannya sendiri
      if (id === session.userId && role && role !== targetUser.role) {
        return sendError(res, 400, 'Anda tidak diizinkan mengubah peran akun Anda sendiri');
      }

      // Validasi role target: tidak boleh SUPER_ADMIN
      if (role === 'SUPER_ADMIN') {
        return sendError(res, 400, 'Tidak dapat menetapkan peran Super Admin');
      }

      const updateData: Record<string, any> = {};

      // 1. Ubah Nama
      if (name && typeof name === 'string' && name.trim()) {
        updateData.name = name.trim();
      }

      // 2. Ubah Email (Khusus Super Admin)
      if (email && typeof email === 'string' && email.trim()) {
        const normalizedEmail = email.trim().toLowerCase();
        if (normalizedEmail !== targetUser.email) {
          if (session.role !== 'SUPER_ADMIN') {
            return sendError(res, 403, 'Hanya Super Admin yang berwenang mengubah email pengguna');
          }

          const existing = await prisma.user.findUnique({
            where: { email: normalizedEmail },
          });
          if (existing && existing.id !== targetUser.id) {
            return sendError(res, 400, 'Alamat email ini sudah terdaftar untuk akun lain');
          }

          updateData.email = normalizedEmail;
        }
      }

      // 3. Ubah Kata Sandi (Super Admin untuk Admin & Editor; Admin untuk Editor)
      let passwordChanged = false;
      if (password && typeof password === 'string' && password.trim()) {
        if (password.trim().length < 8) {
          return sendError(res, 400, 'Kata sandi baru minimal harus 8 karakter');
        }

        const passwordHash = await bcrypt.hash(password.trim(), 10);
        updateData.passwordHash = passwordHash;
        updateData.passwordChangedAt = new Date();
        passwordChanged = true;
      }

      // 4. Ubah Peran (Khusus Super Admin)
      if (role !== undefined && role !== targetUser.role) {
        if (session.role !== 'SUPER_ADMIN') {
          return sendError(res, 403, 'Hanya Super Admin yang berwenang mengubah peran akun');
        }
        updateData.role = role;
      }

      // 5. Ubah Izin Halaman
      if (Array.isArray(permissions)) {
        updateData.permissions = permissions;
      }

      // 6. Ubah Status Akun
      const isDisabling = status === 'DISABLED' && targetUser.status !== 'DISABLED';
      if (status !== undefined) {
        updateData.status = status;
        updateData.isActive = status === 'ACTIVE';
        updateData.disabledAt = status === 'DISABLED' ? new Date() : null;
        updateData.disabledById = status === 'DISABLED' ? session.userId : null;
        updateData.disabledReason = status === 'DISABLED' ? (disabledReason?.trim() || 'Dinonaktifkan oleh administrator') : null;
      }

      const updated = await prisma.$transaction(async (tx) => {
        const userUpdate = await tx.user.update({
          where: { id },
          data: updateData,
        });

        // Jika dinonaktifkan, perannya diubah, atau kata sandinya direset, cabut seluruh sesi aktifnya
        if (isDisabling || (role && role !== targetUser.role) || passwordChanged) {
          await tx.session.deleteMany({ where: { userId: id } });
        }

        return userUpdate;
      });

      // Kirim notifikasi email sistem jika ada perubahan hak akses / penonaktifan
      if (role && role !== targetUser.role) {
        sendSystemEmail({
          to: targetUser.email,
          ...templateRoleChanged({ name: targetUser.name, newRole: role }),
        }).catch(() => {});
      }
      if (isDisabling) {
        sendSystemEmail({
          to: targetUser.email,
          ...templateAccountDisabled({ name: targetUser.name, reason: disabledReason }),
        }).catch(() => {});
      }

      await logSecurityEvent({
        eventType: isDisabling ? 'USER_DISABLED' : (passwordChanged ? 'USER_PASSWORD_RESET_BY_ADMIN' : 'USER_PROFILE_UPDATED_BY_ADMIN'),
        severity: passwordChanged || isDisabling ? 'WARN' : 'INFO',
        actorEmail: session.email,
        ipAddress: ip,
        userAgent,
        details: `Pembaruan akun ${targetUser.email} oleh ${session.email} (Perubahan: ${Object.keys(updateData).join(', ')})`,
      });

      return sendSuccess(res, updated, 'Profil pengguna berhasil diperbarui');
    }

    // 4. DELETE: Hapus pengguna atau cabut seluruh sesi aktif
    if (method === 'DELETE') {
      const urlParams = new URL(req.url || '', `http://${req.headers.host}`).searchParams;
      const targetUserId = urlParams.get('id') || urlParams.get('userId');
      const action = urlParams.get('action') || (urlParams.get('revokeSessions') === 'true' ? 'revoke_sessions' : 'delete_user');

      if (!targetUserId) {
        return sendError(res, 400, 'ID pengguna sasaran wajib disertakan');
      }

      const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
      if (!targetUser) {
        return sendError(res, 404, 'Pengguna tidak ditemukan');
      }

      // Akun Super Admin tidak boleh dihapus atau dicabut sesinya melalui antarmuka ini
      if (targetUser.role === 'SUPER_ADMIN') {
        return sendError(res, 403, 'Aksi ditolak pada akun Super Admin');
      }

      // Pengguna tidak dapat menghapus akunnya sendiri
      if (action === 'delete_user' && targetUser.id === session.userId) {
        return sendError(res, 400, 'Anda tidak dapat menghapus akun Anda sendiri');
      }

      // Admin biasa tidak boleh mencabut sesi atau menghapus sesama Admin
      if (session.role === 'ADMIN' && targetUser.role === 'ADMIN') {
        return sendError(res, 403, 'Hanya Super Admin yang berwenang mengelola atau menghapus akun Admin');
      }

      // OPSI A: CABUT SESI
      if (action === 'revoke_sessions') {
        await revokeAllUserSessions(targetUserId);

        await logSecurityEvent({
          eventType: 'USER_SESSIONS_REVOKED_BY_ADMIN',
          severity: 'WARN',
          actorEmail: session.email,
          ipAddress: ip,
          userAgent,
          details: `Seluruh sesi pengguna ID ${targetUserId} (${targetUser.email}) telah dicabut oleh ${session.email}`,
        });

        return sendSuccess(res, null, 'Seluruh sesi pengguna telah berhasil dicabut');
      }

      // OPSI B: HAPUS PENGGUNA SECARA PERMANEN
      await prisma.$transaction(async (tx) => {
        // Hapus sesi pengguna
        await tx.session.deleteMany({ where: { userId: targetUserId } });
        // Hapus token reset kata sandi jika ada
        await tx.passwordResetToken.deleteMany({ where: { userId: targetUserId } });
        // Hapus undangan jika ada
        await tx.adminInvitation.deleteMany({ where: { email: targetUser.email } });
        // Hapus record user
        await tx.user.delete({ where: { id: targetUserId } });
      });

      await logSecurityEvent({
        eventType: 'USER_DELETED_BY_ADMIN',
        severity: 'WARN',
        actorEmail: session.email,
        ipAddress: ip,
        userAgent,
        details: `Pengguna ${targetUser.name} (${targetUser.email}, role: ${targetUser.role}) telah dihapus permanen oleh ${session.email}`,
      });

      return sendSuccess(res, null, `Pengguna ${targetUser.name} berhasil dihapus secara permanen`);
    }

    return sendError(res, 405, 'Metode HTTP tidak didukung');
  } catch (err: any) {
    return sendError(res, 500, 'Terjadi kesalahan sistem pengolahan pengguna', err.message);
  }
}
