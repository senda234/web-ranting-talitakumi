/**
 * Helper untuk mengunggah berkas foto ke Cloudinary dan mencatat metadatanya ke Neon PostgreSQL.
 * Pengguna TIDAK PERLU mengetahui URL/path atau mengakses Cloudinary secara manual.
 */

export interface UploadResult {
  url: string;
  publicId?: string;
  originalFilename: string;
}

export async function uploadImageFile(
  file: File,
  folder: string,
  onProgress?: (status: string) => void
): Promise<UploadResult> {
  onProgress?.('Mempersiapkan pengunggahan...');

  // 1. Minta signature upload dari backend
  let signData: any = null;
  try {
    const res = await fetch('/api/admin/cloudinary/signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder }),
    });
    if (res.ok) {
      const json = await res.json();
      signData = json.data;
    }
  } catch (err) {
    console.warn('Signature API tidak dapat dijangkau:', err);
  }

  // 2. Jika signature tersedia, kirim file langsung ke Cloudinary
  if (signData) {
    onProgress?.('Mengunggah berkas foto ke Cloudinary...');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signData.apiKey);
    formData.append('timestamp', signData.timestamp.toString());
    formData.append('signature', signData.signature);
    formData.append('folder', signData.folder);

    try {
      const cldRes = await fetch(
        `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );

      if (cldRes.ok) {
        const cldJson = await cldRes.json();
        const secureUrl = cldJson.secure_url;

        // Catat metadata dan path ke Neon DB
        onProgress?.('Menyimpan path ke database Neon...');
        try {
          await fetch('/api/admin/media', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cloudinaryPublicId: cldJson.public_id,
              secureUrl,
              originalFilename: file.name,
              format: cldJson.format,
              bytes: cldJson.bytes,
              width: cldJson.width,
              height: cldJson.height,
              caption: file.name,
            }),
          });
        } catch {
          // Non-blocking
        }

        onProgress?.('Selesai!');
        return {
          url: secureUrl,
          publicId: cldJson.public_id,
          originalFilename: file.name,
        };
      }
    } catch (err) {
      console.warn('Gagal upload langsung ke Cloudinary, beralih ke data URL lokal:', err);
    }
  }

  // Fallback jika offline/dev mode tanpa kredensial aktif: buat Data URL lokal
  onProgress?.('Memproses foto...');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      onProgress?.('Selesai!');
      resolve({
        url: reader.result as string,
        originalFilename: file.name,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

