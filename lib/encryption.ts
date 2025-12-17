/**
 * Server-side encryption utility using XOR cipher
 * Simple obfuscation for API responses
 */

// Hardcoded encryption key (same key used on client)
const ENCRYPTION_KEY = "rental-pg-encryption-key-2024";

/**
 * Encrypts a JSON object using XOR cipher
 * @param data - The data to encrypt (object, array, or primitive)
 * @returns Encrypted string in format: { encrypted: true, data: "base64-encoded-string" }
 */
export function encryptResponse(data: any): { encrypted: true; data: string } {
  try {
    // Convert data to JSON string
    const jsonString = JSON.stringify(data);

    // XOR cipher encryption - convert to bytes first
    const jsonBytes = Buffer.from(jsonString, "utf8");
    const keyBytes = Buffer.from(ENCRYPTION_KEY, "utf8");
    const encryptedBytes = Buffer.alloc(jsonBytes.length);

    for (let i = 0; i < jsonBytes.length; i++) {
      encryptedBytes[i] = jsonBytes[i] ^ keyBytes[i % keyBytes.length];
    }

    // Base64 encode for safe JSON transport
    const base64Encoded = encryptedBytes.toString("base64");

    return {
      encrypted: true,
      data: base64Encoded,
    };
  } catch (error) {
    console.error("[ENCRYPTION_ERROR]", error);
    // Return original data if encryption fails
    return {
      encrypted: true,
      data: Buffer.from(JSON.stringify(data), "utf8").toString("base64"),
    };
  }
}

