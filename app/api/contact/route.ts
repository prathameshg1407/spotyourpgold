import { NextRequest, NextResponse } from "next/server";
import { sendContactEmail } from "@/services/sendContactEmail";

export async function POST(req: NextRequest) {
  try {
    const { fullName, email, subject, message } = await req.json();

    // Validate required fields
    if (!fullName || !email || !subject || !message) {
      return NextResponse.json({
        success: false,
        message: "All fields are required.",
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    // Send email
    const result = await sendContactEmail({
      fullName,
      email,
      subject,
      message,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Thank you for your message! We'll get back to you soon.",
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "Failed to send your message. Please try again later.",
      });
    }
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json({
      success: false,
      message:
        "An error occurred while sending your message. Please try again later.",
    });
  }
}
