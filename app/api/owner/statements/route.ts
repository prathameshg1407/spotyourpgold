// app/api/owner/statements/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Commission from "@/models/commission";
import TenantAllocation from "@/models/tenantAllocation";
import Booking from "@/models/booking";
import Listing from "@/models/listing";
import { authUser } from "@/actions/authUser";

// GET - Get owner statements for download
export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const user = await authUser();
    if (!user || (user.role !== "owner" && user.role !== "admin")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // Format: YYYY-MM
    const year = searchParams.get("year");
    const format = searchParams.get("format") || "json"; // json or pdf

    // Calculate date range
    let startDate: Date;
    let endDate: Date;

    if (month) {
      const [yearPart, monthPart] = month.split("-").map(Number);
      startDate = new Date(yearPart, monthPart - 1, 1);
      endDate = new Date(yearPart, monthPart, 0, 23, 59, 59);
    } else if (year) {
      startDate = new Date(Number(year), 0, 1);
      endDate = new Date(Number(year), 11, 31, 23, 59, 59);
    } else {
      // Default to current month
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    // Get owner's listings
    const listings = await Listing.find({ ownerId: user.id }).select("_id pgName");
    const listingIds = listings.map((l) => l._id);

    // Get bookings in period
    const bookings = await Booking.find({
      listingId: { $in: listingIds },
      status: "confirmed",
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .populate("listingId", "pgName")
      .select("fullName roomType amount securityDeposit moveInDate paymentStatus createdAt");

    // Get rent collections in period
    const allocations = await TenantAllocation.find({
      listingId: { $in: listingIds },
    }).select("pgName roomNumber tenantNotes rentHistory monthlyRent");

    const rentCollections: any[] = [];
    allocations.forEach((allocation: any) => {
      allocation.rentHistory.forEach((rent: any) => {
        if (rent.paidAt && new Date(rent.paidAt) >= startDate && new Date(rent.paidAt) <= endDate) {
          rentCollections.push({
            pgName: allocation.pgName,
            roomNumber: allocation.roomNumber,
            month: rent.month,
            amount: rent.paidAmount,
            paidAt: rent.paidAt,
            paymentMethod: rent.paymentMethod,
          });
        }
      });
    });

    // Get commissions in period
    const commissions = await Commission.find({
      ownerId: user.id,
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .populate({
        path: "bookingId",
        select: "fullName roomType listingId",
        populate: { path: "listingId", select: "pgName" },
      })
      .select("commissionAmount status settledAt settlementMethod createdAt notes");

    // Calculate totals
    const totalBookingRevenue = bookings.reduce(
      (acc, b) => acc + (b.amount || 0) + (b.securityDeposit || 0),
      0
    );
    const totalRentCollected = rentCollections.reduce((acc, r) => acc + r.amount, 0);
    const totalRevenue = totalBookingRevenue + totalRentCollected;

    const totalCommissionPending = commissions
      .filter((c: any) => c.status === "pending" || c.status === "overdue")
      .reduce((acc, c: any) => acc + c.commissionAmount, 0);

    const totalCommissionPaid = commissions
      .filter((c: any) => c.status === "settled")
      .reduce((acc, c: any) => acc + c.commissionAmount, 0);

    const netPayout = totalRevenue - totalCommissionPaid - totalCommissionPending;

    const statement = {
      period: {
        startDate,
        endDate,
        label: month || year || "Current Month",
      },
      owner: {
        id: user.id,
        name: user.fullName,
        email: user.email,
      },
      summary: {
        totalRevenue,
        totalBookingRevenue,
        totalRentCollected,
        totalCommissionPending,
        totalCommissionPaid,
        netPayout,
        bookingsCount: bookings.length,
        rentCollectionsCount: rentCollections.length,
      },
      bookings: bookings.map((b: any) => ({
        pgName: b.listingId?.pgName,
        tenant: b.fullName,
        roomType: b.roomType,
        amount: b.amount,
        securityDeposit: b.securityDeposit,
        total: (b.amount || 0) + (b.securityDeposit || 0),
        moveInDate: b.moveInDate,
        paymentStatus: b.paymentStatus,
        date: b.createdAt,
      })),
      rentCollections,
      commissions: commissions.map((c: any) => ({
        pgName: c.bookingId?.listingId?.pgName,
        tenant: c.bookingId?.fullName,
        amount: c.commissionAmount,
        status: c.status,
        settledAt: c.settledAt,
        settlementMethod: c.settlementMethod,
        notes: c.notes,
        date: c.createdAt,
      })),
      generatedAt: new Date(),
    };

    if (format === "pdf") {
      // Generate PDF
      const pdfBuffer = await generateStatementPDF(statement);
      
      return new Response(pdfBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="statement-${statement.period.label}.pdf"`,
          "Content-Length": String(pdfBuffer.byteLength),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: statement,
    });
  } catch (error) {
    console.error("Get owner statement error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PDF Generation function
async function generateStatementPDF(statement: any): Promise<ArrayBuffer> {
  const html = generateStatementHTML(statement);

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
    if (browser) await browser.close();
  }
}

function generateStatementHTML(statement: any): string {
  const formatCurrency = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Statement - ${statement.period.label}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #333; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #E67E22; }
    .logo { font-size: 24px; font-weight: bold; color: #E67E22; }
    .statement-info { text-align: right; }
    .statement-info h2 { font-size: 20px; margin-bottom: 5px; }
    .owner-info { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }
    .summary-card { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 15px; text-align: center; }
    .summary-card.highlight { background: #E67E22; color: white; }
    .summary-card .label { font-size: 11px; text-transform: uppercase; opacity: 0.8; }
    .summary-card .value { font-size: 20px; font-weight: bold; margin-top: 5px; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #E67E22; border-bottom: 1px solid #eee; padding-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f9f9f9; font-weight: 600; font-size: 11px; text-transform: uppercase; }
    .text-right { text-align: right; }
    .text-green { color: #27ae60; }
    .text-red { color: #e74c3c; }
    .text-orange { color: #E67E22; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 10px; color: #888; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; }
    .badge-green { background: #d4edda; color: #155724; }
    .badge-yellow { background: #fff3cd; color: #856404; }
    .badge-red { background: #f8d7da; color: #721c24; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">SpotYourPG</div>
    <div class="statement-info">
      <h2>OWNER STATEMENT</h2>
      <p>Period: ${formatDate(statement.period.startDate)} - ${formatDate(statement.period.endDate)}</p>
      <p>Generated: ${formatDate(statement.generatedAt)}</p>
    </div>
  </div>

  <div class="owner-info">
    <strong>${statement.owner.name}</strong><br>
    ${statement.owner.email}
  </div>

  <div class="summary-grid">
    <div class="summary-card">
      <div class="label">Total Revenue</div>
      <div class="value text-green">${formatCurrency(statement.summary.totalRevenue)}</div>
    </div>
    <div class="summary-card">
      <div class="label">Commission (Paid + Pending)</div>
      <div class="value text-red">${formatCurrency(statement.summary.totalCommissionPaid + statement.summary.totalCommissionPending)}</div>
    </div>
    <div class="summary-card highlight">
      <div class="label">Net Payout</div>
      <div class="value">${formatCurrency(statement.summary.netPayout)}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Revenue Breakdown</div>
    <table>
      <tr>
        <td>New Bookings Revenue (${statement.summary.bookingsCount} bookings)</td>
        <td class="text-right">${formatCurrency(statement.summary.totalBookingRevenue)}</td>
      </tr>
      <tr>
        <td>Rent Collections (${statement.summary.rentCollectionsCount} payments)</td>
        <td class="text-right">${formatCurrency(statement.summary.totalRentCollected)}</td>
      </tr>
      <tr style="font-weight: bold; background: #f9f9f9;">
        <td>Total Revenue</td>
        <td class="text-right text-green">${formatCurrency(statement.summary.totalRevenue)}</td>
      </tr>
    </table>
  </div>

  ${statement.bookings.length > 0 ? `
  <div class="section">
    <div class="section-title">New Bookings</div>
    <table>
      <thead>
        <tr>
          <th>Property</th>
          <th>Tenant</th>
          <th>Room</th>
          <th>Date</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${statement.bookings.map((b: any) => `
          <tr>
            <td>${b.pgName || 'N/A'}</td>
            <td>${b.tenant}</td>
            <td>${b.roomType}</td>
            <td>${formatDate(b.date)}</td>
            <td class="text-right">${formatCurrency(b.total)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  ${statement.rentCollections.length > 0 ? `
  <div class="section">
    <div class="section-title">Rent Collections</div>
    <table>
      <thead>
        <tr>
          <th>Property</th>
          <th>Room</th>
          <th>Month</th>
          <th>Paid On</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${statement.rentCollections.map((r: any) => `
          <tr>
            <td>${r.pgName}</td>
            <td>${r.roomNumber}</td>
            <td>${formatDate(r.month)}</td>
            <td>${formatDate(r.paidAt)}</td>
            <td class="text-right">${formatCurrency(r.amount)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <div class="section">
    <div class="section-title">Commission Summary</div>
    <table>
      <tr>
        <td>Commission Paid</td>
        <td class="text-right">${formatCurrency(statement.summary.totalCommissionPaid)}</td>
      </tr>
      <tr>
        <td>Commission Pending</td>
        <td class="text-right text-orange">${formatCurrency(statement.summary.totalCommissionPending)}</td>
      </tr>
      <tr style="font-weight: bold; background: #f9f9f9;">
        <td>Total Commission</td>
        <td class="text-right text-red">${formatCurrency(statement.summary.totalCommissionPaid + statement.summary.totalCommissionPending)}</td>
      </tr>
    </table>
  </div>

  <div class="footer">
    <p>This is a computer-generated statement from SpotYourPG.</p>
    <p>For queries, contact support@spotyourpg.com</p>
  </div>
</body>
</html>
  `;
}