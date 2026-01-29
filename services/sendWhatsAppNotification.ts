// services/sendWhatsAppNotification.ts
"use server";

const AISENSY_API_URL = "https://backend.aisensy.com/campaign/t1/api/v2";
const AISENSY_API_KEY = process.env.AISENSY_API_KEY;

// ============================================
// RENT REMINDER
// ============================================
interface WhatsAppRentReminderParams {
  to: string;
  tenantName: string;
  pgName: string;
  amount: number;
  dueDate: string;
  daysRemaining: number;
}

export const sendWhatsAppRentReminder = async ({
  to,
  tenantName,
  pgName,
  amount,
  dueDate,
  daysRemaining,
}: WhatsAppRentReminderParams) => {
  try {
    if (!AISENSY_API_KEY) {
      console.error("AiSensy API key is missing");
      return { success: false, message: "API key missing" };
    }

    // Format phone number
    const formattedPhone = to.replace(/[^0-9]/g, "");
    const phoneWithCountryCode = formattedPhone.startsWith("91")
      ? formattedPhone
      : `91${formattedPhone}`;

    // Generate status text based on days remaining
    let statusText: string;
    if (daysRemaining < 0) {
      statusText = `Overdue by ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) > 1 ? "s" : ""}`;
    } else if (daysRemaining === 0) {
      statusText = "Due Today";
    } else {
      statusText = `Due in ${daysRemaining} day${daysRemaining > 1 ? "s" : ""}`;
    }

    const amountFormatted = `₹${amount.toLocaleString("en-IN")}`;

    // Single template: rent_payment_reminder
    // Params: {{1}}=name, {{2}}=pgName, {{3}}=amount, {{4}}=dueDate, {{5}}=status
    const payload = {
      apiKey: AISENSY_API_KEY,
      campaignName: "Rent Payment Reminder",
      destination: phoneWithCountryCode,
      userName: tenantName,
      templateParams: [
        tenantName,
        pgName,
        amountFormatted,
        dueDate,
        statusText,
      ],
      source: "SpotYourPG",
      media: {},
      buttons: [],
      carouselCards: [],
      location: {},
    };

    console.log("Sending WhatsApp rent reminder:", {
      phone: phoneWithCountryCode,
      template: "rent_payment_reminder",
      params: payload.templateParams,
    });

    const response = await fetch(AISENSY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("AiSensy API Error:", result);
      return {
        success: false,
        message: result.message || "Failed to send WhatsApp message",
        error: result,
      };
    }

    console.log("WhatsApp rent reminder sent successfully:", result);
    return {
      success: true,
      message: "WhatsApp reminder sent successfully",
      data: result,
    };
  } catch (error: any) {
    console.error("Error sending WhatsApp rent reminder:", error);
    return {
      success: false,
      message: error.message || "Failed to send WhatsApp reminder",
    };
  }
};

// ============================================
// GENERIC NOTIFICATION
// ============================================
interface WhatsAppNotificationParams {
  to: string;
  campaignName: string;
  templateParams: string[];
  userName?: string;
}

export const sendWhatsAppNotification = async ({
  to,
  campaignName,
  templateParams,
  userName = "User",
}: WhatsAppNotificationParams) => {
  try {
    if (!AISENSY_API_KEY) {
      console.error("AiSensy API key is missing");
      return { success: false, message: "API key missing" };
    }

    const formattedPhone = to.replace(/[^0-9]/g, "");
    const phoneWithCountryCode = formattedPhone.startsWith("91")
      ? formattedPhone
      : `91${formattedPhone}`;

    const payload = {
      apiKey: AISENSY_API_KEY,
      campaignName,
      destination: phoneWithCountryCode,
      userName,
      templateParams,
      source: "SpotYourPG",
      media: {},
      buttons: [],
      carouselCards: [],
      location: {},
    };

    console.log("Sending WhatsApp notification:", {
      phone: phoneWithCountryCode,
      campaign: campaignName,
      params: templateParams,
    });

    const response = await fetch(AISENSY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("AiSensy API Error:", result);
      return {
        success: false,
        message: result.message || "Failed to send",
        error: result,
      };
    }

    console.log("WhatsApp notification sent successfully:", result);
    return {
      success: true,
      message: "Message sent successfully",
      data: result,
    };
  } catch (error: any) {
    console.error("Error sending WhatsApp notification:", error);
    return {
      success: false,
      message: error.message || "Failed to send",
    };
  }
};

// ============================================
// BOOKING CONFIRMATION
// ============================================
interface BookingConfirmationParams {
  to: string;
  tenantName: string;
  pgName: string;
  roomType: string;
  moveInDate: string;
  amount: number;
}

export const sendBookingConfirmationWhatsApp = async ({
  to,
  tenantName,
  pgName,
  roomType,
  moveInDate,
  amount,
}: BookingConfirmationParams) => {
  // Template: booking_confirmation
  // Params: {{1}}=name, {{2}}=pgName, {{3}}=roomType, {{4}}=moveInDate, {{5}}=amount
  return sendWhatsAppNotification({
    to,
    campaignName: "Booking Confirmation",
    userName: tenantName,
    templateParams: [
      tenantName,
      pgName,
      roomType,
      moveInDate,
      `₹${amount.toLocaleString("en-IN")}`,
    ],
  });
};

// ============================================
// BOOKING APPROVED
// ============================================
interface BookingApprovedParams {
  to: string;
  tenantName: string;
  pgName: string;
  roomType: string;
  moveInDate: string;
}

export const sendBookingApprovedWhatsApp = async ({
  to,
  tenantName,
  pgName,
  roomType,
  moveInDate,
}: BookingApprovedParams) => {
  // Template: booking_approved
  // Params: {{1}}=name, {{2}}=pgName, {{3}}=roomType, {{4}}=moveInDate
  return sendWhatsAppNotification({
    to,
    campaignName: "Booking Approved",
    userName: tenantName,
    templateParams: [tenantName, pgName, roomType, moveInDate],
  });
};

// ============================================
// BOOKING REJECTED
// ============================================
interface BookingRejectedParams {
  to: string;
  tenantName: string;
  pgName: string;
  reason?: string;
}

export const sendBookingRejectedWhatsApp = async ({
  to,
  tenantName,
  pgName,
  reason = "Please contact the PG owner for more details",
}: BookingRejectedParams) => {
  // Template: booking_rejected
  // Params: {{1}}=name, {{2}}=pgName, {{3}}=reason
  return sendWhatsAppNotification({
    to,
    campaignName: "Booking Rejected",
    userName: tenantName,
    templateParams: [tenantName, pgName, reason],
  });
};

// ============================================
// PAYMENT RECEIVED
// ============================================
interface PaymentReceivedParams {
  to: string;
  tenantName: string;
  pgName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
}

export const sendPaymentReceivedWhatsApp = async ({
  to,
  tenantName,
  pgName,
  amount,
  paymentDate,
  paymentMethod,
}: PaymentReceivedParams) => {
  // Template: payment_received
  // Params: {{1}}=name, {{2}}=pgName, {{3}}=amount, {{4}}=date, {{5}}=method
  return sendWhatsAppNotification({
    to,
    campaignName: "Payment Received",
    userName: tenantName,
    templateParams: [
      tenantName,
      pgName,
      `₹${amount.toLocaleString("en-IN")}`,
      paymentDate,
      paymentMethod,
    ],
  });
};

// ============================================
// VISIT SCHEDULED
// ============================================
interface VisitScheduledParams {
  to: string;
  userName: string;
  pgName: string;
  visitDate: string;
  visitTime: string;
  address: string;
}

export const sendVisitScheduledWhatsApp = async ({
  to,
  userName,
  pgName,
  visitDate,
  visitTime,
  address,
}: VisitScheduledParams) => {
  // Template: visit_scheduled
  // Params: {{1}}=name, {{2}}=pgName, {{3}}=date, {{4}}=time, {{5}}=address
  return sendWhatsAppNotification({
    to,
    campaignName: "Visit Scheduled",
    userName,
    templateParams: [userName, pgName, visitDate, visitTime, address],
  });
};