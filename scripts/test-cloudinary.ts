import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function testUpload() {
  console.log('Testing Cloudinary with cloud_name:', process.env.CLOUDINARY_CLOUD_NAME);

  const samplePath = path.resolve(process.cwd(), 'public/foto/backround.jpg');
  console.log('Uploading sample photo:', samplePath);

  try {
    const res = await cloudinary.uploader.upload(samplePath, {
      folder: 'talitakumi/site/hero',
      use_filename: true,
      unique_filename: false,
      overwrite: true,
    });

    console.log('✅ Upload test SUCCESS!');
    console.log('Public ID:', res.public_id);
    console.log('Secure URL:', res.secure_url);
    console.log('Format:', res.format);
    console.log('Bytes:', res.bytes);
    console.log('Dimensions:', `${res.width}x${res.height}`);
  } catch (err) {
    console.error('❌ Upload test FAILED:', err);
  }
}

testUpload();

