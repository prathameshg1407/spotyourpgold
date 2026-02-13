// DIFFERENT API ENDPOINT - Using Project API Key
const AISENSY_API_URL = "https://backend.aisensy.com/campaign/t1/api";
const PROJECT_API_KEY = "25cfb80cc7cf467d30a64";
const PROJECT_ID = "695e3b82adb9905c89bd0fd6";

async function testAiSensyV2() {
  const testPayload = {
    apiKey: PROJECT_API_KEY,
    projectId: PROJECT_ID,
    campaignName: "New PG Booking Request",
    destination: "919820963243",
    userName: "Prathamesh",
    templateParams: [
      "Prathamesh",
      "Wakad",
      "Swaran",
      "9136870930",
      "single occupancy",
      "09/02/2026",
      "4500",
      "online"
    ],
    source: "SpotYourPG"
  };

  console.log("🔄 Testing AiSensy API V2 (Project API)...\n");
  console.log("📍 URL:", AISENSY_API_URL);
  console.log("🔑 Project API Key:", PROJECT_API_KEY);
  console.log("🆔 Project ID:", PROJECT_ID);
  console.log("📱 Destination:", testPayload.destination);
  console.log("📋 Campaign:", testPayload.campaignName);
  console.log("\nPayload:");
  console.log(JSON.stringify(testPayload, null, 2));
  console.log("\n");

  try {
    const response = await fetch(AISENSY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testPayload),
    });

    const result = await response.json();

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 RESPONSE:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Status Code:", response.status);
    console.log("Status Text:", response.statusText);
    console.log("Success:", response.ok);
    console.log("\nFull Response:");
    console.log(JSON.stringify(result, null, 2));
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    if (!response.ok) {
      console.error("❌ TEST FAILED!");
    } else {
      console.log("✅ TEST SUCCESSFUL!");
    }
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
  }
}

testAiSensyV2();