import api from './api';

// Upload photo to backend CDN/Cloudinary endpoint, returns hosted URL
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
