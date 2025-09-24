// utils/urlState.js
import CryptoJS from "crypto-js";

// Use environment variable for secret key
const SECRET_KEY = import.meta.env.VITE_EMAIL_STATE_SECRET;

/**
 * Encode an object into a URL-safe encrypted string
 * @param {Object} data 
 * @returns {string}
 */
export const encodeState = (data) => {
  const str = JSON.stringify(data);
  const encrypted = CryptoJS.AES.encrypt(str, SECRET_KEY).toString();
  return encodeURIComponent(encrypted);
};

/**
 * Decode an encrypted URL state string back to object
 * @param {string} hash 
 * @returns {Object|null}
 */
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
