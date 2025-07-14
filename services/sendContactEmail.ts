"use server";

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // e.g., your Gmail
    pass: process.env.EMAIL_PASS, // App password if using Gmail
  },
});

export const sendContactEmail = async ({
  fullName,
  email,
  subject,
  message,
}: {
  fullName: string;
  email: string;
  subject: string;
  message: string;
}) => {
  const emailSubject = `Contact Form Submission: ${subject}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #4F46E5; margin: 0;">SpotYourPG</h1>
        <h2 style="color: #333; margin: 10px 0;">New Contact Form Submission</h2>
      </div>
      
      <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <div style="background-color: #f0f4ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #4F46E5; margin: 0 0 15px 0;">📧 Contact Details:</h3>
          <p style="margin: 5px 0; color: #333;"><strong>Full Name:</strong> ${fullName}</p>
          <p style="margin: 5px 0; color: #333;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 5px 0; color: #333;"><strong>Subject:</strong> ${subject}</p>
        </div>
        
        <div style="margin: 20px 0;">
          <h3 style="color: #4F46E5; margin: 0 0 15px 0;">💬 Message:</h3>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #4F46E5;">
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p>
          </div>
        </div>
        
        <div style="margin: 20px 0; padding: 15px; background-color: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
          <h4 style="color: #856404; margin: 0 0 10px 0;">📋 Quick Actions:</h4>
          <p style="color: #856404; margin: 5px 0; font-size: 14px;">
            • Reply to: <a href="mailto:${email}" style="color: #4F46E5;">${email}</a>
          </p>
          <p style="color: #856404; margin: 5px 0; font-size: 14px;">
            • Received: ${new Date().toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
            })} IST
          </p>
        </div>
      </div>
      
      <div style="text-align: center; padding: 20px; border-top: 1px solid #ddd; margin-top: 20px;">
        <p style="color: #666; font-size: 14px; margin: 0;">
          This email was sent from the SpotYourPG contact form.
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"SpotYourPG Contact Form" <${process.env.EMAIL_USER}>`,
      to: "spotyourpg@gmail.com",
      subject: emailSubject,
      html,
      replyTo: email, // Allow direct reply to the user
    });
    return { success: true, message: "Contact email sent successfully." };
  } catch (error) {
    console.error("Error sending contact email:", error);
    return { success: false, message: "Failed to send contact email." };
  }
};
