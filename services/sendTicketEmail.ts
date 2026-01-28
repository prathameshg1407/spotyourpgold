// services/sendTicketEmail.ts
import nodemailer from "nodemailer";

interface TicketEmailParams {
  type: 
    | "ticket_created"
    | "ticket_response"
    | "ticket_resolved"
    | "ticket_escalated_admin"
    | "ticket_escalated_user"
    | "ticket_escalated_owner";
  to: string;
  ticketNumber: string;
  subject?: string;
  category?: string;
  priority?: string;
  message?: string;
  resolution?: string;
  userName?: string;
  pgName?: string;
  daysElapsed?: number;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendTicketEmail(params: TicketEmailParams) {
  const { type, to, ticketNumber, subject, category, priority, message, resolution, userName, pgName, daysElapsed } = params;

  let emailSubject = "";
  let emailBody = "";

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://spotyourpg.com";

  switch (type) {
    case "ticket_created":
      emailSubject = `Ticket Created: ${ticketNumber} - ${subject}`;
      emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">SpotYourPG Support</h1>
          </div>
          <div style="padding: 30px; background: #fff;">
            <h2 style="color: #333;">Ticket Created Successfully</h2>
            <p>Your support ticket has been created with the following details:</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Ticket Number:</strong> ${ticketNumber}</p>
              <p><strong>Subject:</strong> ${subject}</p>
              <p><strong>Category:</strong> ${category?.replace("_", " ")}</p>
              <p><strong>Priority:</strong> ${priority}</p>
            </div>
            <p>We will review your ticket and respond as soon as possible.</p>
            <a href="${baseUrl}/routes/dashboard/user/support" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">View Ticket</a>
          </div>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666;">
            <p>© 2025 SpotYourPG. All rights reserved.</p>
          </div>
        </div>
      `;
      break;

    case "ticket_response":
      emailSubject = `New Response: ${ticketNumber}`;
      emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">SpotYourPG Support</h1>
          </div>
          <div style="padding: 30px; background: #fff;">
            <h2 style="color: #333;">New Response on Your Ticket</h2>
            <p>There's a new response on your ticket <strong>${ticketNumber}</strong>:</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316;">
              <p>${message}</p>
            </div>
            <a href="${baseUrl}/routes/dashboard/user/support" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">View & Reply</a>
          </div>
        </div>
      `;
      break;

    case "ticket_resolved":
      emailSubject = `Ticket Resolved: ${ticketNumber}`;
      emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">✓ Ticket Resolved</h1>
          </div>
          <div style="padding: 30px; background: #fff;">
            <h2 style="color: #333;">Your Ticket Has Been Resolved</h2>
            <p>Ticket <strong>${ticketNumber}</strong> - "${subject}" has been resolved.</p>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
              <p><strong>Resolution:</strong></p>
              <p>${resolution}</p>
            </div>
            <p>Please take a moment to rate your experience.</p>
            <a href="${baseUrl}/routes/dashboard/user/support" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Rate Experience</a>
          </div>
        </div>
      `;
      break;

    case "ticket_escalated_admin":
      emailSubject = `🚨 ESCALATED: ${ticketNumber} - Requires Immediate Attention`;
      emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">🚨 Escalated Ticket</h1>
          </div>
          <div style="padding: 30px; background: #fff;">
            <h2 style="color: #dc2626;">Immediate Attention Required</h2>
            <p>A ticket has been automatically escalated to you due to no resolution within 3 days.</p>
            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #fca5a5;">
              <p><strong>Ticket Number:</strong> ${ticketNumber}</p>
              <p><strong>Subject:</strong> ${subject}</p>
              <p><strong>Category:</strong> ${category?.replace("_", " ")}</p>
              <p><strong>Priority:</strong> ${priority}</p>
              <p><strong>User:</strong> ${userName}</p>
              <p><strong>PG:</strong> ${pgName}</p>
              <p><strong>Days Elapsed:</strong> ${daysElapsed} days</p>
            </div>
            <a href="${baseUrl}/routes/dashboard/admin/tickets" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Take Action Now</a>
          </div>
        </div>
      `;
      break;

    case "ticket_escalated_user":
      emailSubject = `Your Ticket ${ticketNumber} Has Been Escalated`;
      emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Ticket Escalated</h1>
          </div>
          <div style="padding: 30px; background: #fff;">
            <h2 style="color: #333;">Your Ticket Has Been Escalated</h2>
            <p>We apologize for the delay. Your ticket <strong>${ticketNumber}</strong> - "${subject}" has been escalated to our admin team for faster resolution.</p>
            <p>Our admin team will prioritize your request and respond shortly.</p>
            <a href="${baseUrl}/routes/dashboard/user/support" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">View Ticket</a>
          </div>
        </div>
      `;
      break;

    case "ticket_escalated_owner":
      emailSubject = `⚠️ Ticket Escalated: ${ticketNumber} - ${pgName}`;
      emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">⚠️ Ticket Escalated</h1>
          </div>
          <div style="padding: 30px; background: #fff;">
            <h2 style="color: #333;">Ticket Escalated to Admin</h2>
            <p>The following ticket for your property <strong>${pgName}</strong> has been escalated to admin due to delayed resolution:</p>
            <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #fcd34d;">
              <p><strong>Ticket Number:</strong> ${ticketNumber}</p>
              <p><strong>Subject:</strong> ${subject}</p>
            </div>
            <p>Please ensure faster resolution of future tickets to maintain service quality.</p>
          </div>
        </div>
      `;
      break;
  }

  await transporter.sendMail({
    from: `"SpotYourPG Support" <${process.env.SMTP_FROM || "support@spotyourpg.com"}>`,
    to,
    subject: emailSubject,
    html: emailBody,
  });
}