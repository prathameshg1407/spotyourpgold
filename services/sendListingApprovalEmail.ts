"use server";

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // e.g., your Gmail
    pass: process.env.EMAIL_PASS, // App password if using Gmail
  },
});

export const sendListingApprovalEmail = async ({
  to,
  ownerName,
  pgName,
  location,
  listingId,
}: {
  to: string;
  ownerName: string;
  pgName: string;
  location: {
    area: string;
    city: string;
    state: string;
  };
  listingId: string;
}) => {
  const subject = "🎉 Your PG Listing is Now Live on SpotYourPG!";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #4F46E5; margin: 0;">SpotYourPG</h1>
        <h2 style="color: #333; margin: 10px 0;">🎉 Your PG Listing is Now Live!</h2>
      </div>
      
      <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <p style="color: #333; font-size: 16px; line-height: 1.6;">Dear <strong>${ownerName}</strong>,</p>
        
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          We're excited to inform you that your PG listing — "<strong>${pgName}</strong>" — has been successfully approved and is now live on SpotYourPG.com!
        </p>
        
        <div style="background-color: #f0f4ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #4F46E5; margin: 0 0 15px 0;">🏡 Listing Details:</h3>
          <p style="margin: 5px 0; color: #333;"><strong>PG Name:</strong> ${pgName}</p>
          <p style="margin: 5px 0; color: #333;"><strong>Location:</strong> ${location.area}, ${location.city}, ${location.state}</p>
          <p style="margin: 5px 0; color: #333;"><strong>Listing ID:</strong> ${listingId}</p>
          <p style="margin: 5px 0; color: #333;"><strong>Status:</strong> <span style="color: #10B981;">✅ Active</span></p>
        </div>
        
        <div style="margin: 20px 0;">
          <h3 style="color: #4F46E5; margin: 0 0 15px 0;">📢 What's Next?</h3>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Your property is now visible to thousands of potential tenants searching for trusted PG accommodations. You can start receiving inquiries and bookings instantly!
          </p>
        </div>
        
        <div style="margin: 20px 0;">
          <h3 style="color: #4F46E5; margin: 0 0 15px 0;">💡 Maximize Your Reach:</h3>
          <ul style="color: #333; font-size: 16px; line-height: 1.6; padding-left: 20px;">
            <li>Make sure all photos and amenities are updated</li>
            <li>Respond promptly to tenant queries</li>
            <li>Share your listing on WhatsApp, Instagram, or Facebook to get more views</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://spotyourpg.com/pg-details/${listingId}" 
             style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
            🔗 View My Listing
          </a>
        </div>
        
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Thank you for choosing SpotYourPG — <strong>Your PG, Just a Click Away</strong>.
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; border-top: 1px solid #ddd; margin-top: 20px;">
        <p style="color: #333; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">Warm regards,</p>
        <p style="color: #4F46E5; font-size: 18px; font-weight: bold; margin: 0 0 15px 0;">Team SpotYourPG</p>
        
        <div style="color: #666; font-size: 14px; line-height: 1.6;">
          <p style="margin: 5px 0;">📞 <a href="tel:+91-9111475455" style="color: #4F46E5; text-decoration: none;">+91-9111475455</a></p>
          <p style="margin: 5px 0;">📧 <a href="mailto:info@spotyourpg.com" style="color: #4F46E5; text-decoration: none;">info@spotyourpg.com</a></p>
          <p style="margin: 5px 0;">🌐 <a href="https://www.spotyourpg.com" style="color: #4F46E5; text-decoration: none;">www.spotyourpg.com</a></p>
        </div>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"SpotYourPG" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return {
      success: true,
      message: "Listing approval email sent successfully.",
    };
  } catch (error) {
    console.error("Error sending listing approval email:", error);
    return {
      success: false,
      message: "Failed to send listing approval email.",
    };
  }
};
