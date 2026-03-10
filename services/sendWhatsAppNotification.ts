"use server";

import { connectToDB } from "@/services/connectdb";
import NotificationLog from "@/models/notificationLog";

const AISENSY_PROJECT_ID = process.env.AISENSY_PROJECT_ID;
const AISENSY_API_PASSWORD = process.env.AISENSY_PROJECT_API_PWD;
const AISENSY_API_URL = `https://apis.aisensy.com/project-apis/v1/project/${AISENSY_PROJECT_ID}/messages`;

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

// ============================================
// DEBUG CONFIGURATION
// ============================================
const DEBUG_MODE = true; // Set to false in production

const debugLog = (category: string, message: string, data?: any) => {
  if (DEBUG_MODE) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`[${category}] ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
    console.log(`${"=".repeat(60)}\n`);
  }
};

// ============================================
// TYPES
// ============================================
interface WhatsAppResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
  messageId?: string;
}

interface NotificationLogData {
  userId?: string;
  phoneNumber: string;
  templateName: string;
  templateParams: any[];
  status: "success" | "failed" | "pending";
  response?: any;
  error?: any;
  retryCount?: number;
  messageId?: string;
}

// ============================================
// UTILITIES
// ============================================
const formatPhoneNumber = (phone: string): string => {
  debugLog("FORMAT_PHONE", `Input phone: "${phone}"`);

  if (!phone) {
    debugLog("FORMAT_PHONE", "❌ Phone is null/undefined");
    return "";
  }

  const cleaned = phone.replace(/\D/g, "");
  debugLog("FORMAT_PHONE", `Cleaned phone: "${cleaned}"`);

  let formatted = "";

  if (cleaned.length === 10) {
    formatted = `91${cleaned}`;
    debugLog("FORMAT_PHONE", `10 digits detected, adding 91: "${formatted}"`);
  } else if (cleaned.length === 12 && cleaned.startsWith("91")) {
    formatted = cleaned;
    debugLog("FORMAT_PHONE", `Already has 91 prefix: "${formatted}"`);
  } else if (cleaned.length === 11 && cleaned.startsWith("0")) {
    formatted = `91${cleaned.substring(1)}`;
    debugLog("FORMAT_PHONE", `Leading 0 detected, replacing with 91: "${formatted}"`);
  } else {
    formatted = cleaned;
    debugLog("FORMAT_PHONE", `⚠️ Unusual format, returning as is: "${formatted}"`);
  }

  return formatted;
};

const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString("en-IN")}`;
};

const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================
// LOGGING
// ============================================
const logNotification = async (data: NotificationLogData) => {
  try {
    await connectToDB();
    await NotificationLog.create({
      ...data,
      createdAt: new Date(),
    });
    debugLog("NOTIFICATION_LOG", "✅ Notification logged to database", {
      templateName: data.templateName,
      phoneNumber: data.phoneNumber,
      status: data.status,
      messageId: data.messageId,
    });
  } catch (error) {
    console.error("Failed to log notification:", error);
  }
};

// ============================================
// CORE SEND FUNCTION
// ============================================
const sendWithRetry = async (
  payload: any,
  retryCount = 0
): Promise<WhatsAppResponse> => {
  try {
    console.log(`\n[WhatsApp Debug] Attempt ${retryCount + 1}`);

    // Log full payload on first attempt
    if (retryCount === 0 && DEBUG_MODE) {
      debugLog("PAYLOAD", "Full request payload", payload);
      debugLog("API_CONFIG", "API Configuration", {
        url: AISENSY_API_URL,
        hasProjectId: !!AISENSY_PROJECT_ID,
        hasPassword: !!AISENSY_API_PASSWORD,
        projectId: AISENSY_PROJECT_ID,
        passwordLength: AISENSY_API_PASSWORD?.length,
      });
    }

    const response = await fetch(AISENSY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-AiSensy-Project-API-Pwd": AISENSY_API_PASSWORD!,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    console.log(`[WhatsApp] Response Status: ${response.status}`);

    if (DEBUG_MODE) {
      debugLog("API_RESPONSE", `Status: ${response.status}`, result);

      // Log specific delivery info
      if (result.messages && result.messages[0]) {
        console.log(`[WhatsApp] Message ID: ${result.messages[0].id}`);
      }
      if (result.contacts && result.contacts[0]) {
        console.log(`[WhatsApp] Contact Status:`, result.contacts[0]);
      }
    }

    if (!response.ok) {
      debugLog("API_ERROR", `HTTP ${response.status} Error`, result);

      if (response.status === 401 || response.status === 403) {
        throw new Error(`Authentication failed: ${result.error?.message || result.message || 'Invalid credentials'}`);
      }

      if (response.status === 422) {
        throw new Error(`Validation Error: ${result.error?.message || result.message || 'Invalid template or parameters'}`);
      }

      throw new Error(result.error?.message || result.message || `HTTP ${response.status}`);
    }

    return {
      success: true,
      message: "Message sent successfully",
      data: result,
      messageId: result.messages?.[0]?.id,
    };
  } catch (error: any) {
    console.error(`[WhatsApp Error] Attempt ${retryCount + 1}:`, error.message);

    const isAuthError = error.message?.includes('Authentication failed');
    const isValidationError = error.message?.includes('Validation Error');

    if (isAuthError || isValidationError || retryCount >= MAX_RETRY_ATTEMPTS) {
      throw error;
    }

    console.log(`[WhatsApp] Retrying in ${RETRY_DELAY * (retryCount + 1)}ms...`);
    await delay(RETRY_DELAY * (retryCount + 1));
    return sendWithRetry(payload, retryCount + 1);
  }
};

// ============================================
// MAIN NOTIFICATION FUNCTION
// ============================================
export const sendWhatsAppNotification = async ({
  to,
  templateName,
  templateParams,
  userId,
}: {
  to: string;
  templateName: string;
  templateParams: string[];
  userId?: string;
}): Promise<WhatsAppResponse> => {
  debugLog("WHATSAPP_NOTIFICATION", "Starting notification", {
    to,
    templateName,
    paramCount: templateParams.length,
    userId,
  });

  if (!AISENSY_PROJECT_ID || !AISENSY_API_PASSWORD) {
    console.error("[WhatsApp Error] Missing AiSensy credentials in environment");
    return {
      success: false,
      message: "WhatsApp service not configured"
    };
  }

  if (!to || !templateName || !templateParams) {
    debugLog("VALIDATION", "Missing required parameters", { to, templateName, templateParams });
    return {
      success: false,
      message: "Missing required parameters",
    };
  }

  const formattedPhone = formatPhoneNumber(to);

  if (!formattedPhone || formattedPhone.length < 10) {
    debugLog("VALIDATION", `Invalid phone number: "${to}" -> "${formattedPhone}"`);
    await logNotification({
      userId,
      phoneNumber: to,
      templateName,
      templateParams,
      status: "failed",
      error: "Invalid phone number format",
    });
    return { success: false, message: "Invalid phone number" };
  }

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: formattedPhone,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: "en"
      },
      components: [
        {
          type: "body",
          parameters: templateParams.map(param => ({
            type: "text",
            text: String(param)
          }))
        }
      ]
    }
  };

  try {
    console.log(`\n[WhatsApp] Sending "${templateName}" to ${formattedPhone}`);
    console.log(`[WhatsApp] Template Parameters:`, templateParams);

    const result = await sendWithRetry(payload);

    await logNotification({
      userId,
      phoneNumber: formattedPhone,
      templateName,
      templateParams,
      status: "success",
      response: result.data,
      messageId: result.messageId,
    });

    console.log(`[WhatsApp Success] Message sent! ID: ${result.messageId}`);

    return result;
  } catch (error: any) {
    console.error(`[WhatsApp Failed] ${templateName}:`, error.message);

    await logNotification({
      userId,
      phoneNumber: formattedPhone,
      templateName,
      templateParams,
      status: "failed",
      error: error.message || String(error),
      retryCount: MAX_RETRY_ATTEMPTS,
    });

    return {
      success: false,
      message: error.message || "Failed to send WhatsApp message",
      error: error.message,
    };
  }
};

// ============================================
// BOOKING NOTIFICATIONS - WITH DEBUGGING
// ============================================

export const sendNewBookingRequestToOwner = async ({
  ownerPhone,
  ownerName,
  ownerId,
  pgLocation,
  tenantName,
  tenantPhone,
  roomType,
  moveInDate,
  bookingFee,
  paymentMethod,
}: {
  ownerPhone: string;
  ownerName: string;
  ownerId?: string;
  pgLocation: string;
  tenantName: string;
  tenantPhone: string;
  roomType: string;
  moveInDate: Date | string;
  bookingFee: number;
  paymentMethod: "online" | "cash";
}) => {
  debugLog("OWNER_NOTIFICATION", "Input Data", {
    ownerPhone,
    ownerName,
    ownerId,
    pgLocation,
    tenantName,
    tenantPhone,
    roomType,
    moveInDate,
    bookingFee,
    paymentMethod,
  });

  const templateParams = [
    ownerName,
    pgLocation,
    tenantName,
    tenantPhone,
    roomType,
    formatDate(moveInDate),
    String(bookingFee),
    paymentMethod === "online" ? "online" : "cash"
  ];

  debugLog("OWNER_NOTIFICATION", "Template Parameters", templateParams);

  return sendWhatsAppNotification({
    to: ownerPhone,
    templateName: "new_booking_alert",
    templateParams,
    userId: ownerId,
  });
};

export const sendBookingConfirmationToTenant = async ({
  tenantPhone,
  tenantName,
  tenantId,
  pgName,
  roomType,
  moveInDate,
}: {
  tenantPhone: string;
  tenantName: string;
  tenantId?: string;
  pgName: string;
  roomType: string;
  moveInDate: Date | string;
}) => {
  debugLog("TENANT_NOTIFICATION", "Input Data", {
    tenantPhone,
    tenantName,
    tenantId,
    pgName,
    roomType,
    moveInDate,
  });

  const templateParams = [
    tenantName,
    pgName,
    roomType,
    formatDate(moveInDate),
  ];

  debugLog("TENANT_NOTIFICATION", "Template Parameters", templateParams);

  return sendWhatsAppNotification({
    to: tenantPhone,
    templateName: "user_booking_received",
    templateParams,
    userId: tenantId,
  });
};

// Rest of the notification functions remain the same but with debugging added...

export const sendBookingApprovedToTenant = async ({
  tenantPhone,
  tenantName,
  tenantId,
  pgName,
  roomType,
  moveInDate,
}: {
  tenantPhone: string;
  tenantName: string;
  tenantId?: string;
  pgName: string;
  roomType: string;
  moveInDate: Date | string;
}) => {
  debugLog("APPROVAL_NOTIFICATION", "Input Data", {
    tenantPhone,
    tenantName,
    pgName,
    roomType,
    moveInDate,
  });

  return sendWhatsAppNotification({
    to: tenantPhone,
    templateName: "user_booking_received",
    templateParams: [
      tenantName,
      pgName,
      roomType,
      formatDate(moveInDate),
    ],
    userId: tenantId,
  });
};

export const sendBookingRejectedToTenant = async ({
  tenantPhone,
  tenantName,
  tenantId,
  pgName,
  reason,
}: {
  tenantPhone: string;
  tenantName: string;
  tenantId?: string;
  pgName: string;
  reason?: string;
}) => {
  debugLog("REJECTION_NOTIFICATION", "Input Data", {
    tenantPhone,
    tenantName,
    pgName,
    reason,
  });

  return sendWhatsAppNotification({
    to: tenantPhone,
    templateName: "new_booking_alert",
    templateParams: [
      tenantName,
      pgName,
      "SpotYourPG Team",
      "support@spotyourpg.com",
      "N/A",
      "N/A",
      "0",
      reason || "Booking Rejected",
    ],
    userId: tenantId,
  });
};

export const sendPaymentReceivedNotification = async ({
  to,
  userName,
  userId,
  amount,
  paymentType,
  pgName,
  transactionId,
}: {
  to: string;
  userName: string;
  userId?: string;
  amount: number;
  paymentType: string;
  pgName: string;
  transactionId: string;
}) => {
  debugLog("PAYMENT_NOTIFICATION", "Input Data", {
    to,
    userName,
    amount,
    paymentType,
    pgName,
    transactionId,
  });

  return sendWhatsAppNotification({
    to,
    templateName: "new_booking_alert",
    templateParams: [
      userName,
      pgName,
      "Payment Received",
      transactionId,
      paymentType,
      formatDate(new Date()),
      String(amount),
      "Paid",
    ],
    userId,
  });
};

export const sendRentReminderToTenant = async ({
  tenantPhone,
  tenantName,
  tenantId,
  pgName,
  amount,
  dueDate,
  daysRemaining,
}: {
  tenantPhone: string;
  tenantName: string;
  tenantId?: string;
  pgName: string;
  amount: number;
  dueDate: Date | string;
  daysRemaining: number;
}) => {
  let statusText: string;
  if (daysRemaining < 0) {
    statusText = `Overdue by ${Math.abs(daysRemaining)} days`;
  } else if (daysRemaining === 0) {
    statusText = "Due Today";
  } else {
    statusText = `Due in ${daysRemaining} days`;
  }

  debugLog("RENT_REMINDER", "Input Data", {
    tenantPhone,
    tenantName,
    pgName,
    amount,
    dueDate,
    daysRemaining,
    statusText,
  });

  return sendWhatsAppNotification({
    to: tenantPhone,
    templateName: "new_booking_alert",
    templateParams: [
      tenantName,
      pgName,
      "Rent Reminder",
      tenantPhone,
      "Monthly Rent",
      formatDate(dueDate),
      String(amount),
      statusText,
    ],
    userId: tenantId,
  });
};

export const sendVisitScheduledNotification = async ({
  to,
  userName,
  userId,
  pgName,
  visitDate,
  visitTime,
  address,
  ownerPhone,
}: {
  to: string;
  userName: string;
  userId?: string;
  pgName: string;
  visitDate: Date | string;
  visitTime: string;
  address: string;
  ownerPhone: string;
}) => {
  debugLog("VISIT_NOTIFICATION", "Input Data", {
    to,
    userName,
    pgName,
    visitDate,
    visitTime,
    address,
    ownerPhone,
  });

  return sendWhatsAppNotification({
    to,
    templateName: "new_booking_alert",
    templateParams: [
      userName,
      pgName,
      "Visit Scheduled",
      ownerPhone,
      address,
      formatDate(visitDate),
      visitTime,
      "Confirmed",
    ],
    userId,
  });
};

export const sendVisitRequestToOwner = async ({
  ownerPhone,
  ownerName,
  ownerId,
  pgName,
  visitorName,
  visitorPhone,
  visitDate,
  visitTime,
}: {
  ownerPhone: string;
  ownerName: string;
  ownerId?: string;
  pgName: string;
  visitorName: string;
  visitorPhone: string;
  visitDate: Date | string;
  visitTime: string;
}) => {
  debugLog("VISIT_REQUEST_OWNER", "Input Data", {
    ownerPhone,
    ownerName,
    pgName,
    visitorName,
    visitorPhone,
    visitDate,
    visitTime,
  });

  const templateParams = [
    ownerName,              // {{1}}
    pgName,                 // {{2}}
    visitorName,            // {{3}}
    visitorPhone,           // {{4}}
    formatDate(visitDate),  // {{5}}
    visitTime,              // {{6}}
  ];

  debugLog("VISIT_REQUEST_OWNER", "Template Parameters", templateParams);

  return sendWhatsAppNotification({
    to: ownerPhone,
    templateName: "visit_request_alert", // EXACT name from AiSensy dashboard
    templateParams,
    userId: ownerId,
  });
};

export const sendBulkWhatsAppNotifications = async (
  notifications: Array<{
    to: string;
    templateName: string;
    templateParams: string[];
    userId?: string;
  }>
): Promise<Array<WhatsAppResponse>> => {
  debugLog("BULK_NOTIFICATIONS", `Processing ${notifications.length} notifications`);

  const results: Array<WhatsAppResponse> = [];

  const BATCH_SIZE = 10;
  const BATCH_DELAY = 2000;

  for (let i = 0; i < notifications.length; i += BATCH_SIZE) {
    const batch = notifications.slice(i, i + BATCH_SIZE);

    console.log(`[Bulk] Processing batch ${Math.floor(i / BATCH_SIZE) + 1} with ${batch.length} notifications`);

    const batchPromises = batch.map((notification) =>
      sendWhatsAppNotification(notification)
    );

    const batchResults = await Promise.allSettled(batchPromises);

    batchResults.forEach((result, index) => {
      if (result.status === "fulfilled") {
        results.push(result.value);
        console.log(`[Bulk] Notification ${i + index + 1}: Success`);
      } else {
        results.push({
          success: false,
          message: "Failed to send notification",
          error: result.reason,
        });
        console.log(`[Bulk] Notification ${i + index + 1}: Failed - ${result.reason}`);
      }
    });

    if (i + BATCH_SIZE < notifications.length) {
      console.log(`[Bulk] Waiting ${BATCH_DELAY}ms before next batch...`);
      await delay(BATCH_DELAY);
    }
  }

  console.log(`[Bulk] Completed. Success: ${results.filter(r => r.success).length}/${notifications.length}`);

  return results;
};

// ============================================
// TEST FUNCTION
// ============================================
export const testWhatsAppConnection = async (phoneNumber: string = "919999999999") => {
  console.log("\n" + "=".repeat(60));
  console.log("TESTING WHATSAPP CONNECTION");
  console.log("=".repeat(60));

  console.log("Environment Variables:");
  console.log(`AISENSY_PROJECT_ID: ${AISENSY_PROJECT_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`AISENSY_API_PASSWORD: ${AISENSY_API_PASSWORD ? '✅ Set' : '❌ Missing'}`);

  const result = await sendWhatsAppNotification({
    to: phoneNumber,
    templateName: "new_booking_alert",
    templateParams: [
      "Test User",
      "Test Location",
      "Test Tenant",
      "9999999999",
      "Single",
      formatDate(new Date()),
      "1000",
      "online"
    ],
    userId: "test123",
  });

  console.log("\nTest Result:", result);
  console.log("=".repeat(60) + "\n");

  return result;
};