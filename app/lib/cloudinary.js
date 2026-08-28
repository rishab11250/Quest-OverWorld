import api from './api';

/**
 * Upload an image from React Native client to Cloudinary / server CDN.
 * Returns hosted image URL string (e.g. https://res.cloudinary.com/... or /uploads/...).
 * @param {string} base64OrUri
 * @param {string} folder
 * @returns {Promise<string>}
 */
export const uploadPhoto = async (base64OrUri, folder = 'quest_overworld_proofs') => {
  if (!base64OrUri) return '';
  if (base64OrUri.startsWith('http://') || base64OrUri.startsWith('https://')) {
    return base64OrUri;
  }

  try {
    const res = await api.post('/upload', {
      image: base64OrUri,
      folder,
    });
    return res?.url || '';
  } catch (err) {
    console.warn('Upload via /api/upload failed:', err.message);
    return base64OrUri;
  }
};

export default {
  uploadPhoto,
};
