const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Detects image format from URL, data URI, or magic bytes in base64
const detectImageFormat = (input) => {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // Already a remote URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return { mime: null, ext: null, isUrl: true };
  }

  // Data URI scheme with explicit image MIME type
  const dataUriMatch = trimmed.match(/^data:image\/(png|jpeg|jpg|gif|webp);base64,/i);
  if (dataUriMatch) {
    const rawExt = dataUriMatch[1].toLowerCase();
    const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
    const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
    return { mime, ext: `.${ext}`, isUrl: false };
  }

  // Sniff magic bytes from raw base64
  if (trimmed.startsWith('iVBORw0KGgo')) {
    return { mime: 'image/png', ext: '.png', isUrl: false };
  }
  if (trimmed.startsWith('R0lGOD')) {
    return { mime: 'image/gif', ext: '.gif', isUrl: false };
  }
  if (trimmed.startsWith('UklGR')) {
    return { mime: 'image/webp', ext: '.webp', isUrl: false };
  }
  if (trimmed.startsWith('/9j/')) {
    return { mime: 'image/jpeg', ext: '.jpg', isUrl: false };
  }

  return null;
};

// Turns raw base64 or raw strings into standard data URIs
const normalizeImageData = (input) => {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();

  // Already a remote URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Already has data URI scheme
  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  // Raw base64 string — detect format or default to jpeg
  const detected = detectImageFormat(trimmed);
  const mime = detected?.mime || 'image/jpeg';

  return `data:${mime};base64,${trimmed}`;
};

// Uploads proof images to Cloudinary (falls back to local /uploads if unconfigured)
const uploadImage = async (base64OrDataUrl, folder = 'quest_overworld_proofs') => {
  if (!base64OrDataUrl) return '';

  const normalized = normalizeImageData(base64OrDataUrl);

  // If already an HTTP/HTTPS URL, return as is
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized;
  }

  // Strip any accidental surrounding quotes from environment variables
  const cleanEnv = (val) =>
    val
      ? val
          .toString()
          .replace(/^["']|["']$/g, '')
          .trim()
      : '';
  const cloudName = cleanEnv(process.env.CLOUDINARY_CLOUD_NAME);
  const apiKey = cleanEnv(process.env.CLOUDINARY_API_KEY);
  const apiSecret = cleanEnv(process.env.CLOUDINARY_API_SECRET);

  // 1. Upload to Cloudinary REST API
  if (cloudName && apiKey && apiSecret && cloudName !== 'your_cloudinary_cloud_name') {
    try {
      const timestamp = Math.round(new Date().getTime() / 1000);
      const signatureString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
      const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

      const formData = new URLSearchParams();
      formData.append('file', normalized);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);
      formData.append('folder', folder);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const data = await response.json();
      if (data.secure_url) {
        return data.secure_url;
      }
      console.warn('Cloudinary upload warning:', data.error?.message || 'Fallback to static');
    } catch (err) {
      console.warn('Cloudinary upload network error, falling back to local CDN:', err.message);
    }
  }

  // 2. Local CDN static disk storage fallback
  try {
    const cleanBase64 = normalized.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const detected = detectImageFormat(base64OrDataUrl);
    const ext = detected?.ext || '.jpg';
    const filename = `proof_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;
    const filePath = path.join(uploadDir, filename);

    fs.writeFileSync(filePath, buffer);
    return `/uploads/${filename}`;
  } catch (err) {
    console.error('Failed to store image on disk:', err);
    throw new Error('Image storage failed.');
  }
};

module.exports = {
  uploadImage,
  normalizeImageData,
  detectImageFormat,
};
