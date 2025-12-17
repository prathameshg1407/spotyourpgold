/**
 * Axios configuration with response interceptor for auto-decryption
 * This file should be imported once in the app (e.g., in app layout or root component)
 */

"use client";

import axios from "axios";
import { decryptResponse, isEncryptedResponse } from "./decryption";

// Setup response interceptor to auto-decrypt encrypted responses
axios.interceptors.response.use(
  (response) => {
    // Check if response data is encrypted
    if (isEncryptedResponse(response.data)) {
      try {
        // Decrypt the response data
        response.data = decryptResponse(response.data);
      } catch (error) {
        console.error("[AXIOS_DECRYPTION_ERROR]", error);
        // If decryption fails, return original response
      }
    }
    return response;
  },
  (error) => {
    // Handle errors normally
    return Promise.reject(error);
  }
);

// Export configured axios instance
export default axios;

