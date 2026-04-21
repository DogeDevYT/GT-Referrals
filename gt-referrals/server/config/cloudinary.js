import { v2 as cloudinary } from 'cloudinary';

let initialized = false;
let configured = false;

function ensureCloudinaryConfig() {
  if (initialized) {
    return configured;
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  configured = Boolean(cloudName && apiKey && apiSecret);

  if (configured) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
  }

  initialized = true;
  return configured;
}

export function isCloudinaryConfigured() {
  return ensureCloudinaryConfig();
}

export async function uploadProfilePhotoToCloudinary({ buffer, mimeType, userId }) {
  if (!ensureCloudinaryConfig()) {
    throw new Error('Cloudinary is not configured');
  }

  const dataUri = `data:${mimeType};base64,${buffer.toString('base64')}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: 'gt-referrals/profiles',
    resource_type: 'image',
    public_id: `user_${userId}_${Date.now()}`,
    overwrite: true,
    invalidate: true,
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}

export async function deleteCloudinaryAsset(publicId) {
  if (!ensureCloudinaryConfig() || !publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch {
    // Ignore cleanup failures to avoid blocking profile updates.
  }
}
