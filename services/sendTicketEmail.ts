// services/sendTicketEmail.ts
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

interface TicketEmailParams {
  type: "ticket_created" | "ticket_updated" | "ticket_resolved" | "new_response";
  to: string;
  ticketNumber: string;
  subject: string;
  category?: string;
  priority?: string;
  message?: string;
  resolution?: string;
}

export const sendTicketEmail = async (params: TicketEmailParams) => {
  const { type, to, ticketNumber, subject, category, priority, message, resolution } = params;

  if (!to) return { success: false, message: "Email address not provided" };

  const subjectMap = {
    ticket_created: `Ticket ${ticketNumber} Created - SpotYourPG Support`,
    ticket_updated: `Update on Ticket ${ticketNumber} - SpotYourPG`,
    ticket_resolved: `Ticket ${ticketNumber} Resolved - SpotYourPG`,
    new_response: `New Response on Ticket ${ticketNumber} - SpotYourPG`,
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "urgent": return "#dc3545";
      case "high": return "#fd7e14";
      case "medium": return "#0d6efd";
      case "low": return "#6c757d";
      default: return "#0d6efd";
    }
  };

  let htmlContent = "";

  switch (type) {
    case "ticket_created":
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #E67E22;">Spot<span style="color: #333;">Your</span>PG</h2>
          </div>
          
          <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
            <h3 style="color: #155724; margin: 0;">✅ Ticket Created Successfully</h3>
          </div>

          <p>Your support ticket has been created. Here are the details:</p>

          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; width: 40%;">Ticket Number:</td>
                <td style="padding: 8px 0; font-weight: bold; font-family: monospace; color: #E67E22;">${ticketNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Subject:</td>
                <td style="padding: 8px 0; font-weight: bold;">${subject}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Category:</td>
                <td style="padding: 8px 0;">${category?.replace("_", " ").toUpperCase()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Priority:</td>
                <td style="padding: 8px 0;">
                  <span style="background: ${getPriorityColor(priority || "medium")}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
                    ${priority?.toUpperCase()}
                  </span>
                </td>
              </tr>
            </table>
          </div>

          <p>Our team will review your ticket and respond as soon as possible.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/routes/dashboard/user/support" 
               style="background: #E67E22; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Track Your Ticket
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          
          <p style="color: #888; font-size: 12px; text-align: center;">
            This is an automated email from SpotYourPG Support.<br/>
            Please do not reply to this email directly.
          </p>
        </div>
      `;
      break;

    case "ticket_resolved":
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #E67E22;">Spot<span style="color: #333;">Your</span>PG</h2>
          </div>
          
          <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
            <h3 style="color: #155724; margin: 0;">✅ Ticket Resolved</h3>
          </div>

          <p>Great news! Your support ticket <strong>${ticketNumber}</strong> has been resolved.</p>

          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; font-weight: bold;">Subject:</p>
            <p style="margin: 0;">${subject}</p>
            
            ${resolution ? `
            <p style="margin: 20px 0 10px 0; font-weight: bold;">Resolution:</p>
            <p style="margin: 0; background: #e8f5e9; padding: 10px; border-radius: 4px;">${resolution}</p>
            ` : ""}
          </div>

          <p>Please rate your experience to help us improve our support.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/routes/dashboard/user/support" 
               style="background: #E67E22; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Rate Your Experience
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          
          <p style="color: #888; font-size: 12px; text-align: center;">
            Thank you for using SpotYourPG!
          </p>
        </div>
      `;
      break;

    case "new_response":
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #E67E22;">Spot<span style="color: #333;">Your</span>PG</h2>
          </div>
          
          <div style="background: #cce5ff; border-left: 4px solid #0d6efd; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
            <h3 style="color: #004085; margin: 0;">💬 New Response on Your Ticket</h3>
          </div>

          <p>You have received a new response on ticket <strong>${ticketNumber}</strong>.</p>

          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; font-weight: bold;">Subject:</p>
            <p style="margin: 0 0 20px 0;">${subject}</p>
            
            ${message ? `
            <p style="margin: 0 0 10px 0; font-weight: bold;">Latest Response:</p>
            <div style="background: white; padding: 15px; border-radius: 4px; border-left: 3px solid #E67E22;">
              <p style="margin: 0;">${message}</p>
            </div>
            ` : ""}
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/routes/dashboard/user/support" 
               style="background: #E67E22; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Full Conversation
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          
          <p style="color: #888; font-size: 12px; text-align: center;">
            This is an automated email from SpotYourPG Support.<br/>
            Please do not reply to this email directly.
          </p>
        </div>
      `;
      break;

    case "ticket_updated":
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #E67E22;">Spot<span style="color: #333;">Your</span>PG</h2>
          </div>
          
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
            <h3 style="color: #856404; margin: 0;">🔄 Ticket Status Updated</h3>
          </div>

          <p>Your support ticket <strong>${ticketNumber}</strong> has been updated.</p>

          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; font-weight: bold;">Subject:</p>
            <p style="margin: 0;">${subject}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/routes/dashboard/user/support" 
               style="background: #E67E22; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Ticket Details
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          
          <p style="color: #888; font-size: 12px; text-align: center;">
            This is an automated email from SpotYourPG Support.
          </p>
        </div>
      `;
      break;

    default:
      return { success: false, message: "Invalid email type" };
  }

  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("Email configuration missing");
      return { success: false, message: "Email service not configured" };
    }

    await transporter.verify();

    await transporter.sendMail({
      from: `"SpotYourPG Support" <${process.env.EMAIL_USER}>`,
      to,
      subject: subjectMap[type],
      html: htmlContent,
    });

    return { success: true, message: "Email sent successfully" };
  } catch (error: any) {
    console.error("Error sending ticket email:", error);
    return { success: false, message: "Failed to send email" };
  }
};