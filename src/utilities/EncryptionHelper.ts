import CryptoJS from "crypto-js";

const SECRET_KEY = import.meta.env.VITE_SECRET_KEY;

export const encryptParams = (params: any) => {
  const jsonString = JSON.stringify(params);
  const encrypted = CryptoJS.AES.encrypt(jsonString, SECRET_KEY)?.toString();
  return encodeURIComponent(encrypted);
};

export const decryptParams = (encryptedString: any) => {
  try {
    const decrypted = CryptoJS.AES.decrypt(decodeURIComponent(encryptedString), SECRET_KEY);
    return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
  } catch (error) {
    console.error("Decryption failed", error);
    return null;
  }
};

