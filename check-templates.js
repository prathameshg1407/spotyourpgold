const PROJECT_ID = "695e3b82adb9905c89bd0fd6";
const API_PASSWORD = "25cfb80cc7cf467d30a64";
const API_URL = `https://apis.aisensy.com/project-apis/v1/project/${PROJECT_ID}/messages`;

// Test number - Prathamesh's number
const TEST_PHONE = "919820963243";

async function sendTestMessage() {
  console.log("=" .repeat(60));
  console.log("🚀 WHATSAPP TEST MESSAGE SCRIPT");
  console.log("=" .repeat(60));
  console.log(`\n📱 Sending to: ${TEST_PHONE} (+91 9820963243)`);
  console.log(`⏰ Time: ${new Date().toLocaleString()}\n`);

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: TEST_PHONE,
    type: "template",
    template: {
      name: "new_booking_alert",
      language: {
        code: "en"
      },
      components: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: "Prathamesh"
            },
            {
              type: "text",
              text: "Test PG Mumbai"
            },
            {
              type: "text",
              text: "Test Booking"
            },
            {
              type: "text",
              text: "9999999999"
            },
            {
              type: "text",
              text: "Single Room"
            },
            {
              type: "text",
              text: "15/02/2025"
            },
            {
              type: "text",
              text: "5000"
            },
            {
              type: "text",
              text: "online"
            }
          ]
        }
      ]
    }
  };

  console.log("📤 Sending request to AiSensy...\n");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-AiSensy-Project-API-Pwd": API_PASSWORD,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    console.log("=" .repeat(60));
    console.log("📊 RESPONSE FROM AISENSY:");
    console.log("=" .repeat(60));
    console.log(`Status Code: ${response.status}`);
    console.log(`Status: ${response.ok ? '✅ SUCCESS' : '❌ FAILED'}\n`);
    
    console.log("Full Response:");
    console.log(JSON.stringify(result, null, 2));
    console.log("=" .repeat(60));

    if (result.messages && result.messages[0]) {
      console.log("\n✅✅✅ MESSAGE SENT SUCCESSFULLY! ✅✅✅");
      console.log(`Message ID: ${result.messages[0].id}`);
      console.log(`WhatsApp ID: ${result.contacts[0].wa_id}`);
      console.log("\n📱 CHECK WHATSAPP ON: +91 9820963243");
      console.log("Look for a message from your AiSensy business number");
      
      console.log("\n💡 IF YOU DON'T SEE THE MESSAGE:");
      console.log("1. Check Message Requests in WhatsApp");
      console.log("2. Check Spam/Archived folders");
      console.log("3. Search for the business number");
      console.log("4. Make sure WhatsApp is updated");
    } else if (result.error) {
      console.log("\n❌ ERROR SENDING MESSAGE:");
      console.log(`Error: ${result.error.message || result.error}`);
      
      if (response.status === 401) {
        console.log("\n🔐 Authentication Error - Check API credentials");
      } else if (response.status === 422) {
        console.log("\n⚠️ Template or parameter issue");
      }
    }

  } catch (error) {
    console.error("\n❌ SCRIPT ERROR:");
    console.error(error.message);
    console.error("\nFull error:", error);
  }

  console.log("\n" + "=" .repeat(60));
  console.log("TEST COMPLETE");
  console.log("=" .repeat(60));
}

// Run the test
console.log("\n🔄 Starting WhatsApp test...\n");
sendTestMessage().then(() => {
  console.log("\n✅ Script finished");
}).catch(err => {
  console.error("\n❌ Script failed:", err);
});