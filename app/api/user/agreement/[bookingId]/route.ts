// app/api/user/agreement/[bookingId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import Booking from "@/models/booking";

async function generateAgreementPDF(booking: any, listing: any, owner: any): Promise<ArrayBuffer> {
  const html = generateAgreementHTML(booking, listing, owner);

  let browser = null;

  try {
    const isLocal = process.env.NODE_ENV === "development";

    if (isLocal) {
      // For local development
      const puppeteer = await import("puppeteer");
      browser = await puppeteer.default.launch({
        headless: true,
      });
    } else {
      // For Vercel/production
      const chromium = (await import("@sparticuz/chromium")).default;
      const puppeteer = (await import("puppeteer-core")).default;

      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: { width: 1200, height: 1600 },
        executablePath: await chromium.executablePath(),
        headless: true,
      });
    }

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px",
      },
    });

    return pdfBuffer.buffer as ArrayBuffer;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function generateAgreementHTML(booking: any, listing: any, owner: any): string {
  const today = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const moveInDate = new Date(booking.moveInDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Rental Agreement - SpotYourPG</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Inter', 'Times New Roman', serif;
      font-size: 14px;
      line-height: 1.8;
      color: #333;
      background: #fff;
      padding: 40px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      border-bottom: 3px double #333;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      font-size: 28px;
      margin-bottom: 5px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .header p {
      color: #666;
      font-style: italic;
    }
    .logo {
      font-size: 20px;
      color: #E67E22;
      margin-bottom: 10px;
      font-weight: 700;
    }
    .section {
      margin-bottom: 25px;
    }
    .section h2 {
      font-size: 16px;
      margin-bottom: 10px;
      text-transform: uppercase;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
    }
    .parties {
      display: flex;
      justify-content: space-between;
      gap: 30px;
      margin: 20px 0;
    }
    .party {
      flex: 1;
      padding: 15px;
      background: #f9f9f9;
      border: 1px solid #ddd;
    }
    .party h3 {
      font-size: 12px;
      text-transform: uppercase;
      color: #666;
      margin-bottom: 10px;
    }
    .clause {
      margin-bottom: 15px;
      text-align: justify;
    }
    .clause strong {
      display: block;
      margin-bottom: 5px;
    }
    ul {
      padding-left: 30px;
      margin: 10px 0;
    }
    li {
      margin-bottom: 5px;
    }
    .highlight {
      background: #fff3cd;
      padding: 2px 5px;
      font-weight: 600;
    }
    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 60px;
      padding-top: 30px;
      border-top: 1px solid #ddd;
    }
    .signature-box {
      width: 45%;
      text-align: center;
    }
    .signature-line {
      border-top: 1px solid #333;
      margin-top: 60px;
      padding-top: 10px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .stamp-area {
      width: 150px;
      height: 100px;
      border: 2px dashed #ddd;
      margin: 20px auto;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      font-size: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 10px;
      text-align: left;
    }
    th {
      background: #f5f5f5;
      font-weight: 600;
    }
    @media print {
      body {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">SpotYourPG</div>
      <h1>Rental Agreement</h1>
      <p>PG/Hostel Accommodation Agreement</p>
    </div>

    <div class="section">
      <p>
        This Rental Agreement ("<strong>Agreement</strong>") is made and executed on 
        <span class="highlight">${today}</span> at 
        <span class="highlight">${listing.location.city}, ${listing.location.state}</span>
      </p>
    </div>

    <div class="section">
      <h2>Between</h2>
      <div class="parties">
        <div class="party">
          <h3>First Party (Landlord/Owner)</h3>
          <p><strong>${owner?.fullName || 'PG Owner'}</strong></p>
          <p>${listing.pgName}</p>
          <p>${listing.location.area}</p>
          <p>${listing.location.city}, ${listing.location.state}</p>
          <p>PIN: ${listing.location.pincode}</p>
          ${owner?.phone ? `<p>Phone: ${owner.phone}</p>` : ''}
          ${owner?.email ? `<p>Email: ${owner.email}</p>` : ''}
        </div>
        <div class="party">
          <h3>Second Party (Tenant)</h3>
          <p><strong>${booking.fullName}</strong></p>
          <p>${booking.address.street}</p>
          <p>${booking.address.city}, ${booking.address.state}</p>
          <p>PIN: ${booking.address.pincode}</p>
          <p>Phone: ${booking.phoneNumber}</p>
          <p>Email: ${booking.email}</p>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>1. Property Details</h2>
      <div class="clause">
        The First Party hereby agrees to let out the following premises to the Second Party for residential purposes:
      </div>
      <table>
        <tr>
          <th>Property Name</th>
          <td>${listing.pgName}</td>
        </tr>
        <tr>
          <th>Room Type</th>
          <td>${booking.roomType}</td>
        </tr>
        <tr>
          <th>Address</th>
          <td>${listing.location.area}, ${listing.location.city}, ${listing.location.state} - ${listing.location.pincode}</td>
        </tr>
        <tr>
          <th>Gender Preference</th>
          <td>${listing.genderPreference?.charAt(0).toUpperCase() + listing.genderPreference?.slice(1) || 'Unisex'}</td>
        </tr>
      </table>
    </div>

    <div class="section">
      <h2>2. Term of Agreement</h2>
      <table>
        <tr>
          <th>Commencement Date</th>
          <td>${moveInDate}</td>
        </tr>
        <tr>
          <th>Duration</th>
          <td>${booking.duration} months</td>
        </tr>
        ${listing.detailedRules?.lockInPeriod ? `
        <tr>
          <th>Lock-in Period</th>
          <td>${listing.detailedRules.lockInPeriod}</td>
        </tr>
        ` : ''}
        ${listing.detailedRules?.noticePeriod ? `
        <tr>
          <th>Notice Period</th>
          <td>${listing.detailedRules.noticePeriod}</td>
        </tr>
        ` : ''}
      </table>
    </div>

    <div class="section">
      <h2>3. Rent and Security Deposit</h2>
      <table>
        <tr>
          <th>Monthly Rent</th>
          <td>₹${booking.amount.toLocaleString()} (${numberToWords(booking.amount)} Rupees Only)</td>
        </tr>
        <tr>
          <th>Security Deposit</th>
          <td>₹${booking.securityDeposit.toLocaleString()} (${numberToWords(booking.securityDeposit)} Rupees Only)</td>
        </tr>
        <tr>
          <th>Rent Due Date</th>
          <td>Same date as commencement date of each month</td>
        </tr>
        ${listing.detailedRules?.maintenanceCharges ? `
        <tr>
          <th>Maintenance Charges</th>
          <td>${listing.detailedRules.maintenanceCharges}</td>
        </tr>
        ` : ''}
      </table>
      <div class="clause">
        <ul>
          <li>The security deposit is refundable at the time of vacating, subject to deductions for damages, unpaid dues, or cleaning charges.</li>
          <li>Rent must be paid on or before the due date. Late payment may attract additional charges as decided by the First Party.</li>
        </ul>
      </div>
    </div>

    <div class="section">
      <h2>4. Rent Inclusions</h2>
      <table>
        <tr>
          <th>Food/Meals</th>
          <td>${listing.rentInclusions?.foodIncluded ? '✓ Included' : '✗ Not Included'}</td>
        </tr>
        <tr>
          <th>Electricity</th>
          <td>${listing.rentInclusions?.electricityIncluded ? '✓ Included' : '✗ Not Included (Pay as per usage)'}</td>
        </tr>
        <tr>
          <th>Maintenance</th>
          <td>${listing.rentInclusions?.maintenanceIncluded ? '✓ Included' : '✗ Not Included'}</td>
        </tr>
      </table>
    </div>

    <div class="section">
      <h2>5. Rules and Regulations</h2>
      <div class="clause">
        The Second Party agrees to abide by the following rules and regulations:
      </div>
      <ul>
        ${listing.rulesAndRegulations?.map((rule: string) => `<li>${rule}</li>`).join('') || '<li>Standard PG rules apply</li>'}
        ${listing.detailedRules?.entryTiming ? `<li>Entry Timing: ${listing.detailedRules.entryTiming}</li>` : ''}
        ${listing.detailedRules?.exitTiming ? `<li>Exit Timing: ${listing.detailedRules.exitTiming}</li>` : ''}
        ${listing.detailedRules?.guestStayPolicy ? `<li>Guest/Visitor Policy: ${listing.detailedRules.guestStayPolicy.replace(/-/g, ' ')}</li>` : ''}
        ${listing.detailedRules?.smokingAlcoholPolicy ? `<li>Smoking/Alcohol Policy: ${listing.detailedRules.smokingAlcoholPolicy.replace(/-/g, ' ')}</li>` : ''}
      </ul>
    </div>

    <div class="section">
      <h2>6. Amenities Provided</h2>
      <div class="clause">
        ${listing.amenities?.join(', ') || 'Basic amenities as per PG standards'}
      </div>
    </div>

    <div class="section">
      <h2>7. Termination</h2>
      <div class="clause">
        <ul>
          <li>Either party may terminate this agreement by providing the required notice period as mentioned above.</li>
          <li>In case of violation of any rules, the First Party reserves the right to terminate this agreement immediately without refund.</li>
          <li>The Second Party must clear all dues and return the premises in good condition before vacating.</li>
        </ul>
      </div>
    </div>

    <div class="section">
      <h2>8. General Terms</h2>
      <div class="clause">
        <ul>
          <li>The Second Party shall not sublet the premises to any third party.</li>
          <li>Any damage to the property shall be borne by the Second Party.</li>
          <li>The First Party or their representative may inspect the premises with prior notice.</li>
          <li>This agreement is subject to the laws of India and jurisdiction of courts in ${listing.location.city}.</li>
        </ul>
      </div>
    </div>

    <div class="stamp-area">
      Revenue Stamp
    </div>

    <div class="signatures">
      <div class="signature-box">
        <p><strong>First Party (Landlord)</strong></p>
        <div class="signature-line">
          <p>${owner?.fullName || 'PG Owner'}</p>
          <p style="font-size: 12px; color: #666;">Date: ________________</p>
        </div>
      </div>
      <div class="signature-box">
        <p><strong>Second Party (Tenant)</strong></p>
        <div class="signature-line">
          <p>${booking.fullName}</p>
          <p style="font-size: 12px; color: #666;">Date: ________________</p>
        </div>
      </div>
    </div>

    <div class="signatures" style="margin-top: 40px;">
      <div class="signature-box">
        <p><strong>Witness 1</strong></p>
        <div class="signature-line">
          <p>Name: ________________</p>
          <p style="font-size: 12px; color: #666;">Signature</p>
        </div>
      </div>
      <div class="signature-box">
        <p><strong>Witness 2</strong></p>
        <div class="signature-line">
          <p>Name: ________________</p>
          <p style="font-size: 12px; color: #666;">Signature</p>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>This is a computer-generated agreement facilitated by SpotYourPG.</p>
      <p>Agreement ID: ${booking._id}</p>
      <p>Generated on: ${today}</p>
      <p style="margin-top: 10px;">
        <strong>SpotYourPG</strong> - Find Your Perfect Paying Guest Accommodation<br/>
        www.spotyourpg.com | support@spotyourpg.com
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

// Helper function to convert number to words
function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  if (num === 0) return 'Zero';

  const convertLessThanThousand = (n: number): string => {
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
      return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    }
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
  };

  if (num < 1000) {
    return convertLessThanThousand(num);
  }
  if (num < 100000) {
    return convertLessThanThousand(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 !== 0 ? ' ' + convertLessThanThousand(num % 1000) : '');
  }
  if (num < 10000000) {
    return convertLessThanThousand(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 !== 0 ? ' ' + numberToWords(num % 100000) : '');
  }
  return convertLessThanThousand(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 !== 0 ? ' ' + numberToWords(num % 10000000) : '');
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

    // Get booking with full listing and owner details
    const booking = await Booking.findById(bookingId).populate({
      path: "listingId",
      select: `
        pgName location genderPreference amenities 
        rulesAndRegulations detailedRules mealTimings 
        rentInclusions ownerId
      `,
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

    const listing = booking.listingId as any;
    const owner = listing?.ownerId;

    // Generate PDF instead of HTML
    const pdfBuffer = await generateAgreementPDF(booking, listing, owner);

    // Return PDF as downloadable file
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="rental-agreement-${bookingId}.pdf"`,
        "Content-Length": String(pdfBuffer.byteLength),
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Generate agreement error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate agreement",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}