/**
 * Template Email Sistem Web Ranting Talitakumi
 * Sesuai Dokumen Rancangan Integrasi Google dan Email (§13)
 */

function baseLayout(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; line-height: 1.6; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #0f172a; padding: 28px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
    .header p { margin: 4px 0 0; font-size: 13px; color: #94a3b8; }
    .content { padding: 32px 28px; }
    .content h2 { margin: 0 0 16px; font-size: 18px; color: #0f172a; }
    .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 20px 0; text-align: center; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; background: #eff6ff; color: #1d4ed8; }
    .footer { padding: 20px 28px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
    .footer a { color: #64748b; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Ranting Talitakumi</h1>
      <p>AMGPM Cabang Pniel &bull; Sistem Panel Admin</p>
    </div>
    <div class="content">
      ${bodyContent}
    </div>
    <div class="footer">
      <p>Pemberitahuan resmi ini dikirimkan secara otomatis dari sistem panel admin Web Ranting Talitakumi.<br>Jangan membagikan tautan rahasia kepada siapa pun.</p>
    </div>
  </div>
</body>
</html>`;
}

export function templateInvitation(params: {
  name: string;
  email: string;
  role: string;
  inviteUrl: string;
  invitedByName: string;
}): { subject: string; html: string } {
  const subject = `Undangan Menjadi ${params.role} - Web Ranting Talitakumi`;
  const html = baseLayout(
    subject,
    `
    <h2>Halo, ${params.name}</h2>
    <p>Anda telah diundang oleh <strong>${params.invitedByName}</strong> untuk mengelola Web Ranting Talitakumi sebagai <span class="badge">${params.role}</span>.</p>
    <p>Untuk mengaktifkan akun dan mengakses panel admin, silakan hubungkan akun Google Anda melalui tautan di bawah ini:</p>
    <div style="text-align: center;">
      <a href="${params.inviteUrl}" class="btn" target="_blank">Hubungkan Akun Google</a>
    </div>
    <p style="font-size: 13px; color: #64748b;"><strong>Catatan Penting:</strong> Pastikan Anda masuk menggunakan akun Google dengan email <code>${params.email}</code>. Tautan undangan ini hanya berlaku selama 24 jam.</p>
    `
  );
  return { subject, html };
}

export function templateRoleChanged(params: {
  name: string;
  newRole: string;
}): { subject: string; html: string } {
  const subject = `Pemberitahuan Perubahan Hak Akses - Web Ranting Talitakumi`;
  const html = baseLayout(
    subject,
    `
    <h2>Pemberitahuan Hak Akses</h2>
    <p>Halo <strong>${params.name}</strong>,</p>
    <p>Peran Anda di Web Ranting Talitakumi telah diperbarui menjadi <span class="badge">${params.newRole}</span> oleh Super Admin.</p>
    <p>Jika Anda sedang login, silakan muat ulang halaman panel admin untuk menerapkan perubahan izin.</p>
    `
  );
  return { subject, html };
}

export function templateAccountActivated(params: {
  name: string;
}): { subject: string; html: string } {
  const subject = `Akun Berhasil Diaktifkan - Web Ranting Talitakumi`;
  const html = baseLayout(
    subject,
    `
    <h2>Akun Berhasil Diaktifkan!</h2>
    <p>Halo <strong>${params.name}</strong>,</p>
    <p>Akun Google Anda telah berhasil dihubungkan dan diaktifkan pada sistem panel admin Web Ranting Talitakumi.</p>
    <p>Sekarang Anda dapat masuk kapan saja menggunakan tombol <strong>Masuk dengan Google</strong> pada portal pengurus.</p>
    `
  );
  return { subject, html };
}

export function templateAccountDisabled(params: {
  name: string;
  reason?: string;
}): { subject: string; html: string } {
  const subject = `Pemberitahuan Status Akun - Web Ranting Talitakumi`;
  const html = baseLayout(
    subject,
    `
    <h2>Akun Dinonaktifkan</h2>
    <p>Halo <strong>${params.name}</strong>,</p>
    <p>Akses akun admin Anda untuk Web Ranting Talitakumi telah dinonaktifkan oleh administrator.</p>
    ${params.reason ? `<p><strong>Alasan:</strong> ${params.reason}</p>` : ''}
    <p>Jika Anda merasa ini adalah kekeliruan, silakan hubungi Super Admin ranting.</p>
    `
  );
  return { subject, html };
}

export function templateTestEmail(senderEmail: string): { subject: string; html: string } {
  const subject = `Uji Integrasi Gmail API - Web Ranting Talitakumi`;
  const now = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jayapura' });
  const html = baseLayout(
    subject,
    `
    <h2>Integrasi Gmail Berhasil Terhubung!</h2>
    <p>Email ini mengonfirmasi bahwa layanan pengiriman email sistem Web Ranting Talitakumi telah berhasil terhubung dengan akun pengirim:</p>
    <p><code>${senderEmail}</code></p>
    <p>Waktu pengujian: <strong>${now} WIT</strong></p>
    <p>Sistem siap mengirimkan undangan pengguna dan pemberitahuan keamanan.</p>
    `
  );
  return { subject, html };
}
