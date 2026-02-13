// app/api/user/payments/invoice/[bookingId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import Booking from "@/models/booking";

async function generateInvoicePDF(booking: any): Promise<ArrayBuffer> {
  const html = generateInvoiceHTML(booking);

  let browser = null;

  try {
    const isLocal = process.env.NODE_ENV === "development";

    if (isLocal) {
      const puppeteer = await import("puppeteer");
      browser = await puppeteer.default.launch({ headless: true });
    } else {
      const chromium = (await import("@sparticuz/chromium")).default;
      const puppeteer = (await import("puppeteer-core")).default;

      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: { width: 1200, height: 800 },
        executablePath: await chromium.executablePath(),
        headless: true,
      });
    }

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20px", right: "20px", bottom: "20px", left: "20px" },
    });

    return pdfBuffer.buffer as ArrayBuffer;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function generateInvoiceHTML(booking: any): string {
  const listing = booking.listingId;
  const owner = listing?.ownerId;
  
  // Calculate amounts
  const bookingFee = booking.bookingFee?.amount || 0;
  const securityDeposit = booking.securityDeposit?.amount || 0;
  const firstMonthRent = booking.firstMonthRent?.amount || 0;
  const totalAmount = bookingFee + securityDeposit + firstMonthRent;
  const discountAmount = booking.discountAmount || 0;
  const originalMonthlyRent = booking.originalAmount || booking.monthlyRent;

  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString("en-IN")}`;

  const formatDate = (date: string | Date) => {
    try {
      return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return String(date);
    }
  };

  const getPaymentStatus = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      paid: { label: "PAID", color: "#27AE60" },
      pending: { label: "PENDING", color: "#F39C12" },
      failed: { label: "FAILED", color: "#E74C3C" },
      refunded: { label: "REFUNDED", color: "#9B59B6" },
    };
    return statusMap[status] || { label: status.toUpperCase(), color: "#666" };
  };

  const numberToWords = (num: number): string => {
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];

    if (num === 0) return "Zero";

    const convertLessThanThousand = (n: number): string => {
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
      return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " " + convertLessThanThousand(n % 100) : "");
    };

    if (num < 1000) return convertLessThanThousand(num);
    if (num < 100000) return convertLessThanThousand(Math.floor(num / 1000)) + " Thousand" + (num % 1000 !== 0 ? " " + convertLessThanThousand(num % 1000) : "");
    if (num < 10000000) return convertLessThanThousand(Math.floor(num / 100000)) + " Lakh" + (num % 100000 !== 0 ? " " + numberToWords(num % 100000) : "");
    return convertLessThanThousand(Math.floor(num / 10000000)) + " Crore" + (num % 10000000 !== 0 ? " " + numberToWords(num % 10000000) : "");
  };

  const bookingFeeStatus = getPaymentStatus(booking.bookingFee?.status || "pending");
  const depositStatus = getPaymentStatus(booking.securityDeposit?.status || "pending");
  const rentStatus = getPaymentStatus(booking.firstMonthRent?.status || "pending");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - ${booking._id}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; color: #333; background: #fff; font-size: 12px; line-height: 1.5; }
    .invoice-container { max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #E67E22; }
    .logo { font-size: 28px; font-weight: 700; color: #E67E22; }
    .invoice-title { text-align: right; }
    .invoice-title h1 { font-size: 24px; color: #333; margin-bottom: 8px; }
    .invoice-title .receipt-info { font-size: 10px; color: #666; }
    .billing-section { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .billing-box { width: 48%; }
    .billing-label { font-size: 9px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .billing-name { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 5px; }
    .billing-detail { font-size: 11px; color: #333; margin-bottom: 3px; }
    .booking-id { color: #E67E22; font-weight: 600; margin-top: 10px; }
    .property-section { background: #FFF9F5; border-radius: 8px; padding: 20px; margin-bottom: 25px; }
    .property-title { font-size: 13px; font-weight: 600; color: #333; margin-bottom: 15px; }
    .property-grid { display: flex; justify-content: space-between; }
    .property-column { width: 48%; }
    .property-row { display: flex; margin-bottom: 10px; }
    .property-label { font-size: 9px; color: #666; width: 100px; }
    .property-value { font-size: 11px; font-weight: 600; color: #333; }
    
    .table-container { margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #E67E22; }
    thead th { color: #fff; font-size: 9px; font-weight: 600; text-transform: uppercase; padding: 12px 15px; text-align: left; }
    thead th:nth-child(3), thead th:nth-child(4) { text-align: center; }
    thead th:last-child { text-align: right; }
    tbody tr { border-bottom: 1px solid #EEE; }
    tbody td { padding: 15px; vertical-align: middle; }
    .item-name { font-size: 12px; font-weight: 600; color: #333; margin-bottom: 4px; }
    .item-description { font-size: 9px; color: #666; }
    .item-amount { font-size: 12px; font-weight: 600; color: #333; text-align: right; }
    .status-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 9px; font-weight: 600; text-align: center; }
    
    .totals-section { display: flex; justify-content: flex-end; margin-bottom: 15px; }
    .totals-box { width: 280px; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .total-label { font-size: 11px; color: #666; }
    .total-value { font-size: 11px; font-weight: 600; color: #333; }
    .discount-row .total-label, .discount-row .total-value { color: #27AE60; }
    .grand-total-row { border-top: 2px solid #333; padding-top: 12px; margin-top: 8px; }
    .grand-total-row .total-label { font-size: 13px; font-weight: 600; color: #333; }
    .grand-total-row .total-value { font-size: 18px; font-weight: 700; color: #E67E22; }
    
    .amount-words { font-size: 10px; color: #666; font-style: italic; margin-bottom: 20px; }
    
    .payment-status { border-radius: 8px; padding: 15px; text-align: center; margin-bottom: 25px; }
    .payment-status-title { font-size: 14px; font-weight: 700; margin-bottom: 5px; }
    .payment-status-date { font-size: 11px; }
    
    .terms-section { background: #F5F5F5; border-radius: 8px; padding: 20px; margin-bottom: 25px; }
    .terms-title { font-size: 11px; font-weight: 600; color: #333; margin-bottom: 10px; }
    .terms-list { font-size: 9px; color: #666; }
    .terms-list li { margin-bottom: 6px; list-style: none; }
    .terms-list li::before { content: "• "; color: #E67E22; }
    
    .footer { border-top: 1px solid #EEE; padding-top: 20px; text-align: center; }
    .footer-company { font-size: 12px; font-weight: 600; color: #333; margin-bottom: 8px; }
    .footer-contact { font-size: 10px; color: #666; margin-bottom: 5px; }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="logo">SpotYourPG</div>
      <div class="invoice-title">
        <h1>INVOICE</h1>
        <div class="receipt-info">
          <div>Receipt #${booking._id.toString().slice(-8).toUpperCase()}</div>
          <div>Date: ${formatDate(new Date())}</div>
        </div>
      </div>
    </div>
    
    <div class="billing-section">
      <div class="billing-box">
        <div class="billing-label">Billed To</div>
        <div class="billing-name">${booking.fullName || "N/A"}</div>
        ${booking.email ? `<div class="billing-detail">${booking.email}</div>` : ""}
        ${booking.phoneNumber ? `<div class="billing-detail">${booking.phoneNumber}</div>` : ""}
        ${booking.address?.street ? `<div class="billing-detail">${booking.address.street}</div>` : ""}
        <div class="billing-detail">
          ${booking.address?.city || ""}${booking.address?.state ? ", " + booking.address.state : ""}${booking.address?.pincode ? " - " + booking.address.pincode : ""}
        </div>
      </div>
      <div class="billing-box">
        <div class="billing-label">Property Owner</div>
        <div class="billing-name">${owner?.fullName || "PG Owner"}</div>
        ${owner?.email ? `<div class="billing-detail">${owner.email}</div>` : ""}
        ${owner?.phone ? `<div class="billing-detail">${owner.phone}</div>` : ""}
        <div class="billing-detail booking-id">Booking ID: ${booking._id.toString().slice(-12).toUpperCase()}</div>
      </div>
    </div>
    
    <div class="property-section">
      <div class="property-title">Property Details</div>
      <div class="property-grid">
        <div class="property-column">
          <div class="property-row">
            <span class="property-label">PG Name:</span>
            <span class="property-value">${listing?.pgName || "N/A"}</span>
          </div>
          <div class="property-row">
            <span class="property-label">Room Type:</span>
            <span class="property-value">${booking.roomType || "N/A"}</span>
          </div>
          <div class="property-row">
            <span class="property-label">Location:</span>
            <span class="property-value">${listing?.location?.area || ""}${listing?.location?.city ? ", " + listing.location.city : ""}</span>
          </div>
        </div>
        <div class="property-column">
          <div class="property-row">
            <span class="property-label">Move-in Date:</span>
            <span class="property-value">${formatDate(booking.moveInDate || new Date())}</span>
          </div>
          <div class="property-row">
            <span class="property-label">Duration:</span>
            <span class="property-value">${booking.duration || 0} Months</span>
          </div>
          <div class="property-row">
            <span class="property-label">Payment Method:</span>
            <span class="property-value">${(booking.paymentMethod || "ONLINE").toString().toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Reference</th>
            <th style="text-align: center;">Status</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div class="item-name">Booking Fee (10%)</div>
              <div class="item-description">Non-refundable booking confirmation fee</div>
            </td>
            <td style="font-size: 9px; color: #666;">${booking.bookingFee?.paymentReference || "-"}</td>
            <td style="text-align: center;">
              <span class="status-badge" style="background: ${bookingFeeStatus.color}20; color: ${bookingFeeStatus.color};">
                ${bookingFeeStatus.label}
              </span>
            </td>
            <td class="item-amount">${formatCurrency(bookingFee)}</td>
          </tr>
          <tr>
            <td>
              <div class="item-name">Security Deposit</div>
              <div class="item-description">Refundable deposit (returned at checkout)</div>
            </td>
            <td style="font-size: 9px; color: #666;">${booking.securityDeposit?.paymentReference || "-"}</td>
            <td style="text-align: center;">
              <span class="status-badge" style="background: ${depositStatus.color}20; color: ${depositStatus.color};">
                ${depositStatus.label}
              </span>
            </td>
            <td class="item-amount">${formatCurrency(securityDeposit)}</td>
          </tr>
          <tr>
            <td>
              <div class="item-name">First Month Rent (90%)</div>
              <div class="item-description">First month's rent for ${listing?.pgName || "PG"}</div>
            </td>
            <td style="font-size: 9px; color: #666;">${booking.firstMonthRent?.paymentReference || "-"}</td>
            <td style="text-align: center;">
              <span class="status-badge" style="background: ${rentStatus.color}20; color: ${rentStatus.color};">
                ${rentStatus.label}
              </span>
            </td>
            <td class="item-amount">${formatCurrency(firstMonthRent)}</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="totals-section">
      <div class="totals-box">
        <div class="total-row">
          <span class="total-label">Original Monthly Rent:</span>
          <span class="total-value">${formatCurrency(originalMonthlyRent)}</span>
        </div>
        ${discountAmount > 0 ? `
        <div class="total-row discount-row">
          <span class="total-label">Discount ${booking.couponCode ? `(${booking.couponCode})` : ""}:</span>
          <span class="total-value">-${formatCurrency(discountAmount)}</span>
        </div>
        ` : ""}
        <div class="total-row">
          <span class="total-label">Security Deposit:</span>
          <span class="total-value">${formatCurrency(securityDeposit)}</span>
        </div>
        <div class="total-row grand-total-row">
          <span class="total-label">Total Amount:</span>
          <span class="total-value">${formatCurrency(totalAmount)}</span>
        </div>
        <div class="total-row">
          <span class="total-label">Total Paid:</span>
          <span class="total-value" style="color: #27AE60;">${formatCurrency(booking.totalPaid || 0)}</span>
        </div>
        ${(booking.totalDue - booking.totalPaid) > 0 ? `
        <div class="total-row">
          <span class="total-label">Balance Due:</span>
          <span class="total-value" style="color: #E74C3C;">${formatCurrency(booking.totalDue - booking.totalPaid)}</span>
        </div>
        ` : ""}
      </div>
    </div>
    
    <div class="amount-words">
      Amount in words: ${numberToWords(totalAmount)} Rupees Only
    </div>
    
    ${booking.totalPaid >= booking.totalDue ? `
    <div class="payment-status" style="background: #D4EDDA; border: 1px solid #C3E6CB;">
      <div class="payment-status-title" style="color: #155724;">✓ PAYMENT COMPLETE</div>
      <div class="payment-status-date" style="color: #155724;">
        All payments verified
      </div>
    </div>
    ` : `
    <div class="payment-status" style="background: #FFF3CD; border: 1px solid #FFEEBA;">
      <div class="payment-status-title" style="color: #856404;">⏳ PAYMENT PENDING</div>
      <div class="payment-status-date" style="color: #856404;">
        Balance due: ${formatCurrency(booking.totalDue - booking.totalPaid)}
      </div>
    </div>
    `}
    
    <div class="terms-section">
      <div class="terms-title">Terms & Conditions</div>
      <ul class="terms-list">
        <li>Booking fee (10%) is non-refundable once paid.</li>
        <li>Security deposit is refundable at checkout, subject to property condition.</li>
        <li>Monthly rent is due on the same date as move-in date each month.</li>
        <li>This is a computer-generated invoice and does not require a signature.</li>
        <li>For any queries, contact SpotYourPG support at support@spotyourpg.com</li>
      </ul>
    </div>
    
    <div class="footer">
      <div class="footer-company">SpotYourPG - Find Your Perfect Paying Guest Accommodation</div>
      <div class="footer-contact">Email: support@spotyourpg.com | Website: www.spotyourpg.com</div>
      <div class="footer-contact">Thank you for choosing SpotYourPG!</div>
    </div>
  </div>
</body>
</html>
  `;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    await connectToDB();

    const { bookingId } = await params;

    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return NextResponse.json(
        { success: false, message: "Valid Booking ID is required" },
        { status: 400 }
      );
    }

    const booking = await Booking.findById(bookingId).populate({
      path: "listingId",
      select: "pgName location ownerId",
      populate: {
        path: "ownerId",
        select: "fullName email phone",
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Allow invoice download if any payment is made
    if (booking.totalPaid === 0) {
      return NextResponse.json(
        { success: false, message: "No payments made yet" },
        { status: 400 }
      );
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(booking);

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${bookingId}.pdf"`,
        "Content-Length": String(pdfBuffer.byteLength),
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Generate invoice error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate invoice",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}