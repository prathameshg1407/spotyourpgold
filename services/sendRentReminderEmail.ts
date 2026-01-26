// services/sendRentReminderEmail.ts
"use server";

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

interface RentReminderParams {
  to: string;
  tenantName: string;
  pgName: string;
  amount: number;
  dueDate: string;
  daysRemaining: number;
}

export const sendRentReminderEmail = async ({
  to,
  tenantName,
  pgName,
  amount,
  dueDate,
  daysRemaining,
}: RentReminderParams) => {
  const isOverdue = daysRemaining < 0;
  const subject = isOverdue
    ? `⚠️ Rent Overdue - ${pgName}`
    : daysRemaining <= 3
    ? `🔔 Rent Due in ${daysRemaining} days - ${pgName}`
    : `📅 Rent Reminder - ${pgName}`;

  const urgencyColor = isOverdue ? "#dc3545" : daysRemaining <= 3 ? "#ffc107" : "#28a745";
  const urgencyText = isOverdue
    ? `Your rent is overdue by ${Math.abs(daysRemaining)} days!`
    : daysRemaining <= 3
    ? `Your rent is due in ${daysRemaining} days.`
    : `Your rent is due on ${dueDate}.`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #E67E22;">Spot<span style="color: #333;">Your</span>PG</h2>
      </div>
      
      <div style="background: ${urgencyColor}15; border-left: 4px solid ${urgencyColor}; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
        <h3 style="color: ${urgencyColor}; margin: 0 0 10px 0;">
          ${isOverdue ? '⚠️ Rent Overdue' : '📅 Rent Reminder'}
        </h3>
        <p style="margin: 0; color: #333;">${urgencyText}</p>
      </div>

      <p>Dear <strong>${tenantName}</strong>,</p>
      
      <p>This is a friendly reminder about your upcoming rent payment:</p>

      <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666;">PG Name:</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right;">${pgName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Due Date:</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right;">${dueDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Amount Due:</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #E67E22; font-size: 18px;">₹${amount.toLocaleString()}</td>
          </tr>
        </table>
      </div>

      <p>Please ensure timely payment to avoid any inconvenience.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/routes/dashboard/user/payments" 
           style="background: #E67E22; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View Payment History
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      
      <p style="color: #888; font-size: 12px; text-align: center;">
        This is an automated reminder from SpotYourPG.<br/>
        If you have already made the payment, please ignore this email.
      </p>
    </div>
  `;

  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("Email configuration is missing");
    }

    await transporter.verify();

    await transporter.sendMail({
      from: `"SpotYourPG" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    return { success: true, message: "Reminder sent successfully" };
  } catch (error: any) {
    console.error("Error sending rent reminder email:", error);
    return { success: false, message: "Failed to send reminder" };
  }
};