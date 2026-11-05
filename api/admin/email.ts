import type { IncomingMessage, ServerResponse } from 'http';
import prisma from '../_lib/prisma';
import { getSession } from '../_lib/auth';
import { parseJsonBody } from '../_lib/body';
import { sendSuccess, sendError } from '../_lib/response';
import {
  setSecurityHeaders,
  getClientInfo,
  encryptSecret,
  sendSystemEmail,
  logSecurityEvent,
} from '../_lib/security';
import { templateTestEmail } from '../_lib/email-templates';

/**
 * Endpoint Pengelolaan Integrasi Email Sistem (Gmail API)
 * Otorisasi: Khusus SUPER_ADMIN (§12 & §19.3)
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  setSecurityHeaders(res);

  const session = getSession(req);
  if (!session) {
    return sendError(res, 401, 'Akses ditolak: autentikasi diperlukan');
  }

  // Khusus Super Admin
  if (session.role !== 'SUPER_ADMIN') {
    return sendError(res, 403, 'Akses ditolak: hanya Super Admin yang berwenang mengelola integrasi email');
  }

  const method = req.method;
  const { ip, userAgent } = getClientInfo(req);

  try {
    // 1. GET: Ambil status koneksi email pengirim
    if (method === 'GET') {
      let sender = await prisma.emailSender.findFirst();

      if (!sender) {
        sender = await prisma.emailSender.create({
          data: {
            provider: 'GMAIL_API',
            senderEmail: process.env.EMAIL_SENDER_ADDRESS || 'warahuwenag@gmail.com',
            status: 'DISCONNECTED',
          },
        });
      }

      return sendSuccess(res, {
        sender: {
          id: sender.id,
          provider: sender.provider,
          senderEmail: sender.senderEmail,
          status: sender.status,
          isConnected: sender.status === 'CONNECTED',
          scope: 'https://www.googleapis.com/auth/gmail.send',
          connectedAt: sender.connectedAt,
          lastSuccessAt: sender.lastSuccessAt,
          lastErrorAt: sender.lastErrorAt,
          lastErrorMessage: sender.lastErrorMessage,
        },
      });
    }

    // 2. POST: Aksi pengujian, koneksi, atau pemutusan
    if (method === 'POST') {
      const body = await parseJsonBody(req);
      const action = body.action || 'send-test';

      let sender = await prisma.emailSender.findFirst();
      if (!sender) {
        sender = await prisma.emailSender.create({
          data: {
            provider: 'GMAIL_API',
            senderEmail: process.env.EMAIL_SENDER_ADDRESS || 'warahuwenag@gmail.com',
            status: 'DISCONNECTED',
          },
        });
      }

      // AKSI: KIRIM EMAIL UJI (SEND-TEST)
      if (action === 'send-test') {
        const targetEmail = body.to || sender.senderEmail;
        const testTemplate = templateTestEmail(sender.senderEmail);

        const result = await sendSystemEmail({
          to: targetEmail,
          subject: testTemplate.subject,
          html: testTemplate.html,
        });

        if (!result.success) {
          await logSecurityEvent({
            eventType: 'SYSTEM_EMAIL_TEST_FAILED',
            severity: 'WARN',
            actorEmail: session.email,
            ipAddress: ip,
            userAgent,
            details: `Gagal mengirim email uji ke ${targetEmail}: ${result.error}`,
          });
          return sendError(res, 400, result.error || 'Gagal mengirim email uji.');
        }

        await logSecurityEvent({
          eventType: 'SYSTEM_EMAIL_TEST_SUCCESS',
          severity: 'INFO',
          actorEmail: session.email,
          ipAddress: ip,
          userAgent,
          details: `Email uji berhasil dikirim ke ${targetEmail} (ID: ${result.messageId})`,
        });

        return sendSuccess(
          res,
          { messageId: result.messageId },
          `Email uji berhasil dikirim ke ${targetEmail}.`
        );
      }

      // AKSI: HUBUNGKAN GMAIL DENGAN REFRESH TOKEN (CONNECT)
      if (action === 'connect') {
        const { refreshToken, senderEmail } = body;
        if (!refreshToken) {
          return sendError(res, 400, 'Refresh token Gmail wajib disertakan.');
        }

        const encryptedToken = encryptSecret(refreshToken.trim());
        const emailAddress = senderEmail ? senderEmail.trim().toLowerCase() : sender.senderEmail;

        await prisma.emailSender.update({
          where: { id: sender.id },
          data: {
            senderEmail: emailAddress,
            encryptedRefreshToken: encryptedToken,
            status: 'CONNECTED',
            connectedAt: new Date(),
            connectedById: session.userId,
            lastErrorMessage: null,
          },
        });

        await logSecurityEvent({
          eventType: 'GMAIL_SENDER_CONNECTED',
          severity: 'INFO',
          actorEmail: session.email,
          ipAddress: ip,
          userAgent,
          details: `Akun pengirim Gmail berhasil dihubungkan untuk email: ${emailAddress}`,
        });

        return sendSuccess(res, null, 'Akun Gmail pengirim berhasil dihubungkan.');
      }

      // AKSI: PUTUSKAN KONEKSI GMAIL (DISCONNECT)
      if (action === 'disconnect') {
        await prisma.emailSender.update({
          where: { id: sender.id },
          data: {
            encryptedRefreshToken: null,
            status: 'DISCONNECTED',
            lastErrorMessage: null,
          },
        });

        await logSecurityEvent({
          eventType: 'GMAIL_SENDER_DISCONNECTED',
          severity: 'WARN',
          actorEmail: session.email,
          ipAddress: ip,
          userAgent,
          details: `Koneksi Gmail pengirim diputuskan oleh Super Admin (${session.email})`,
        });

        return sendSuccess(res, null, 'Koneksi akun Gmail pengirim telah diputuskan.');
      }

      return sendError(res, 400, 'Aksi tidak dikenal.');
    }

    return sendError(res, 405, 'Metode tidak diizinkan');
  } catch (err: any) {
    return sendError(res, 500, 'Terjadi kesalahan sistem pengirim email', err.message);
  }
}

