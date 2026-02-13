import axios from "axios";

const AISENSY_API_URL = "https://backend.aisensy.com/campaign/t1/api";
const PROJECT_API_KEY = "25cfb80cc7cf467d30a64"; // Storing here as per user's test file, ideally should be env var
const PROJECT_ID = "695e3b82adb9905c89bd0fd6"; // Storing here as per user's test file

interface WhatsAppMessageParams {
  destination: string;
  userName: string;
  templateParams: string[];
  campaignName: string;
}

export async function sendWhatsAppMessage({
  destination,
  userName,
  templateParams,
  campaignName,
}: WhatsAppMessageParams) {
  try {
    const payload = {
      apiKey: PROJECT_API_KEY,
      projectId: PROJECT_ID,
      campaignName,
      destination,
      userName,
      templateParams,
      source: "SpotYourPG",
    };

    console.log("📤 Sending WhatsApp Message:", JSON.stringify(payload, null, 2));

    const response = await axios.post(AISENSY_API_URL, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("✅ WhatsApp Message Sent:", response.data);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("❌ Failed to send WhatsApp message:", error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}
