/**
 * Client-side decryption utility using XOR cipher
 * Decrypts encrypted API responses
 */

// Hardcoded encryption key (same key used on server)
const ENCRYPTION_KEY = "rental-pg-encryption-key-2024";

/**
 * Decrypts an encrypted response
 * @param encryptedData - The encrypted data object with { encrypted: true, data: string }
 * @returns Decrypted data (parsed JSON)
 */
export function decryptResponse(encryptedData: {
  encrypted: true;
  data: string;
}): any {
  try {
    // Base64 decode to get encrypted bytes
    const encryptedBytes = Uint8Array.from(atob(encryptedData.data), (c) =>
      c.charCodeAt(0)
    );

    // Get key bytes
    const keyBytes = new TextEncoder().encode(ENCRYPTION_KEY);
    const decryptedBytes = new Uint8Array(encryptedBytes.length);

    // XOR cipher decryption
    for (let i = 0; i < encryptedBytes.length; i++) {
      decryptedBytes[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
    }

    // Convert back to UTF-8 string
    const decrypted = new TextDecoder("utf-8").decode(decryptedBytes);

    // Parse JSON and return
    return JSON.parse(decrypted);
  } catch (error) {
    console.error("[DECRYPTION_ERROR]", error);
    // Return original data if decryption fails
    return encryptedData;
  }
}

/**
 * Checks if a response is encrypted
 * @param data - Response data to check
 * @returns true if encrypted, false otherwise
 */
export function isEncryptedResponse(data: any): boolean {
  return (
    data &&
    typeof data === "object" &&
    data.encrypted === true &&
    typeof data.data === "string"
  );
}

