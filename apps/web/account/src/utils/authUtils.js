import CryptoJS from "crypto-js";

const SECRET_KEY = import.meta.env.VITE_EMAIL_STATE_SECRET;

export const encodeState = (data) => {
  const str = JSON.stringify(data);
  const encrypted = CryptoJS.AES.encrypt(str, SECRET_KEY).toString();
  return encodeURIComponent(encrypted);
};

export const decodeState = (hash) => {
  if (!hash) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(decodeURIComponent(hash), SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
};

export const getRedirectUrl = (searchParams) => {
  const redirect = searchParams.get('redirect');
  if (redirect && typeof redirect === 'string') {
    try {
      const decoded = decodeURIComponent(redirect);
      // Validate it's a proper URL (either relative or absolute)
      if (decoded.startsWith('/') || 
          decoded.startsWith('http://') || 
          decoded.startsWith('https://')) {
        return decoded;
      }
    } catch (error) {
      console.error('Error decoding redirect URL:', error);
    }
  }
  // Default to main site
  return 'https://oliviuus.com';
};

export const validateIdentifier = (identifier, type = 'email') => {
  if (!identifier.trim()) return false;
  
  switch (type) {
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    case 'phone':
      return /^\+?[\d\s\-\(\)]+$/.test(identifier.replace(/\s/g, ''));
    case 'username':
      return /^[a-zA-Z0-9_.-]{3,20}$/.test(identifier);
    default:
      return true;
  }
};

// NEW: Generate guest mode parameter
export const generateGuestModeParam = (enabled = false) => {
  const guestData = { guestMode: enabled, timestamp: Date.now() };
  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(guestData), SECRET_KEY).toString();
  return encodeURIComponent(encrypted);
};

// NEW: Decode guest mode parameter
export const decodeGuestModeParam = (hash) => {
  if (!hash) return { guestMode: false };
  try {
    const bytes = CryptoJS.AES.decrypt(decodeURIComponent(hash), SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
  } catch {
    return { guestMode: false };
  }
};