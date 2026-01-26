// scripts/seed-existing-user.ts
import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import User from "../models/user";
import Listing from "../models/listing";
import Booking from "../models/booking";
import SupportTicket from "../models/supportTicket";
import Notification from "../models/notification";

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!MONGODB_URI) {
  console.error("❌ MongoDB URI not found!");
  process.exit(1);
}

// Target user
const TARGET_USER_EMAIL = "nevos40906@mustaer.com";

async function seedExistingUserData() {
  console.log("🚀 Seeding data for existing user...\n");
  console.log("📡 MongoDB URI:", MONGODB_URI?.replace(/\/\/.*@/, "//***:***@").substring(0, 80) + "...");

  try {
    await mongoose.connect(MONGODB_URI!);
    
    const dbName = mongoose.connection.db?.databaseName;
    console.log("\n✅ Connected to MongoDB");
    console.log(`   📁 Database: ${dbName}`);
    
    // List all collections
    const collections = await mongoose.connection.db?.listCollections().toArray();
    console.log(`   📚 Collections: ${collections?.map(c => c.name).join(", ")}`);
    console.log("");

    // ========== FIND USER ==========
    console.log(`🔍 Searching for user: ${TARGET_USER_EMAIL}`);
    
    // First, count total users
    const totalUsers = await User.countDocuments();
    console.log(`   Total users in DB: ${totalUsers}`);
    
    // List first 5 users
    const sampleUsers = await User.find().limit(5).select("email fullName role");
    console.log("   Sample users:");
    sampleUsers.forEach(u => {
      console.log(`     - ${u.email} (${u.role})`);
    });
    console.log("");

    // Find target user
    const user = await User.findOne({ email: TARGET_USER_EMAIL });
    
    if (!user) {
      console.error(`\n❌ User NOT FOUND: ${TARGET_USER_EMAIL}`);
      console.log("\n💡 Possible issues:");
      console.log("   1. User is in a different database");
      console.log("   2. Email is spelled differently");
      console.log("   3. Check your MONGODB_URI in .env/.env.local");
      
      // Try case-insensitive search
      const userCaseInsensitive = await User.findOne({ 
        email: { $regex: new RegExp(`^${TARGET_USER_EMAIL}$`, 'i') }
      });
      
      if (userCaseInsensitive) {
        console.log(`\n✅ Found with case-insensitive search: ${userCaseInsensitive.email}`);
      }
      
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log(`✅ Found user!`);
    console.log(`   Name: ${user.fullName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   ID: ${user._id}`);
    console.log("");

    // ========== FIND OR CREATE OWNER ==========
    console.log("👤 Finding owner for listings...");
    
    // Use existing verified owner
    let owner = await User.findOne({ 
      email: { $in: ["prathameshgaikwad964006@gmail.com", "copowep116@noihse.com"] },
      role: "owner",
      ownerStatus: "verified"
    });
    
    if (!owner) {
      owner = await User.findOne({ role: "owner", ownerStatus: "verified" });
    }
    
    if (!owner) {
      console.log("   ⚠️ No verified owner found, using user as listing creator");
      owner = user;
    } else {
      console.log(`   ✅ Using owner: ${owner.fullName} (${owner.email})`);
    }
    console.log("");

    // ========== CREATE LISTINGS ==========
    console.log("🏠 Creating test listings...");

    // Check for existing test listings and delete them
    const deletedListings = await Listing.deleteMany({ 
      pgName: { $regex: /^Test (Sunshine|Green Valley)/ }
    });
    console.log(`   🗑️ Deleted ${deletedListings.deletedCount} old test listings`);

    const listings = [];

    // Listing 1
    const listing1 = await Listing.create({
      ownerId: owner._id,
      pgName: "Test Sunshine Boys PG",
      slug: `test-sunshine-pg-${Date.now()}`,
      primaryLine: "Premium PG with all amenities",
      type: "pgs",
      subType: "Boys PG",
      genderPreference: "male",
      isCoLiving: false,
      roomTypes: [
        {
          type: "Single Room AC",
          isAC: true,
          numberOfRooms: 10,
          availableRooms: 5,
          capacityPerRoom: 1,
          monthlyRent: 12000,
          securityDeposit: 24000,
        },
        {
          type: "Double Sharing AC",
          isAC: true,
          numberOfRooms: 15,
          availableRooms: 8,
          capacityPerRoom: 2,
          monthlyRent: 8000,
          securityDeposit: 16000,
        },
        {
          type: "Triple Sharing",
          isAC: false,
          numberOfRooms: 10,
          availableRooms: 6,
          capacityPerRoom: 3,
          monthlyRent: 6000,
          securityDeposit: 12000,
        },
      ],
      amenities: ["WiFi", "AC", "Laundry", "Gym", "Power Backup", "CCTV", "Parking", "Food"],
      additionalDetails: ["24/7 Water Supply", "Daily Housekeeping", "Attached Bathroom"],
      rentInclusions: {
        foodIncluded: true,
        electricityIncluded: false,
        maintenanceIncluded: true,
      },
      mealTimings: {
        morning: { enabled: true, from: "07:30", to: "09:30" },
        noon: { enabled: true, from: "12:30", to: "14:30" },
        evening: { enabled: true, from: "17:00", to: "18:00" },
        night: { enabled: true, from: "20:00", to: "22:00" },
      },
      rulesAndRegulations: [
        "No smoking inside premises",
        "No alcohol consumption",
        "Visitors allowed till 8 PM only",
        "Maintain silence after 10 PM",
        "Keep common areas clean",
      ],
      detailedRules: {
        lockInPeriod: "3 months",
        noticePeriod: "1 month",
        maintenanceCharges: "₹500/month",
        registrationFees: "₹1000",
        entryTiming: "Before 10:00 PM",
        exitTiming: "After 6:00 AM",
        guestStayPolicy: "limited-access",
        smokingAlcoholPolicy: "not-allowed",
      },
      images: [
        { url: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800", public_id: "pg_1" },
        { url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800", public_id: "pg_2" },
      ],
      primaryImage: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800",
      location: {
        area: "Vijay Nagar",
        city: "Indore",
        state: "Madhya Pradesh",
        pincode: "452010",
        nearbyPlaces: ["IIM Indore", "Treasure Island Mall", "C21 Mall"],
        coordinates: {
          type: "Point",
          coordinates: [75.8577, 22.7196],
        },
      },
      isApproved: true,
      isActive: true,
      isFeatured: true,
      planType: "paid",
      paymentStatus: "completed",
    });
    listings.push(listing1);
    console.log(`   ✅ Created: ${listing1.pgName}`);

    // Listing 2
    const listing2 = await Listing.create({
      ownerId: owner._id,
      pgName: "Test Green Valley Co-Living",
      slug: `test-coliving-${Date.now()}`,
      primaryLine: "Modern co-living for professionals",
      type: "pgs",
      subType: "Co-Living",
      genderPreference: "unisex",
      isCoLiving: true,
      roomTypes: [
        {
          type: "Private Studio",
          isAC: true,
          numberOfRooms: 6,
          availableRooms: 2,
          capacityPerRoom: 1,
          monthlyRent: 18000,
          securityDeposit: 36000,
        },
        {
          type: "Shared Room",
          isAC: true,
          numberOfRooms: 10,
          availableRooms: 4,
          capacityPerRoom: 2,
          monthlyRent: 11000,
          securityDeposit: 22000,
        },
      ],
      amenities: ["WiFi", "AC", "Laundry", "Gym", "Coworking Space", "Cafeteria"],
      additionalDetails: ["Community Events", "Netflix Lounge"],
      rentInclusions: {
        foodIncluded: false,
        electricityIncluded: true,
        maintenanceIncluded: true,
      },
      mealTimings: {
        morning: { enabled: false, from: "", to: "" },
        noon: { enabled: false, from: "", to: "" },
        evening: { enabled: false, from: "", to: "" },
        night: { enabled: false, from: "", to: "" },
      },
      rulesAndRegulations: [
        "Respect community members",
        "Keep noise levels reasonable",
        "Clean up after yourself",
      ],
      detailedRules: {
        lockInPeriod: "1 month",
        noticePeriod: "1 month",
        maintenanceCharges: "Included",
        registrationFees: "₹2000",
        entryTiming: "24/7 Access",
        exitTiming: "24/7 Access",
        guestStayPolicy: "allowed",
        smokingAlcoholPolicy: "limited-access",
      },
      images: [
        { url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800", public_id: "cl_1" },
      ],
      primaryImage: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
      location: {
        area: "Scheme 78",
        city: "Indore",
        state: "Madhya Pradesh",
        pincode: "452010",
        nearbyPlaces: ["Phoenix Citadel", "Infosys Campus"],
        coordinates: {
          type: "Point",
          coordinates: [75.8866, 22.7533],
        },
      },
      isApproved: true,
      isActive: true,
      isFeatured: true,
      planType: "subscription",
      paymentStatus: "completed",
    });
    listings.push(listing2);
    console.log(`   ✅ Created: ${listing2.pgName}`);
    console.log("");

    // ========== CREATE BOOKINGS ==========
    console.log("📋 Creating bookings...");
    
    // Delete old bookings for this user
    const deletedBookings = await Booking.deleteMany({ userId: user._id });
    console.log(`   🗑️ Deleted ${deletedBookings.deletedCount} old bookings`);

    const userName = user.fullName || "User";
    const userPhone = user.phone || "9876543210";
    const userEmail = user.email;

    const bookings = [];

    // Booking 1: PAID ✅ (Can download invoice)
    bookings.push(await Booking.create({
      userId: user._id,
      listingId: listings[0]._id,
      roomType: "Double Sharing AC",
      moveInDate: new Date("2024-01-15"),
      duration: "6",
      fullName: userName,
      phoneNumber: userPhone,
      email: userEmail,
      address: {
        street: "123, MG Road",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400058",
      },
      status: "confirmed",
      paymentStatus: "completed_cash",
      paymentMethod: "cash",
      amount: 8000,
      originalAmount: 8000,
      discountAmount: 0,
      securityDeposit: 16000,
      termsAccepted: true,
      cashCollectedAt: new Date("2024-01-14"),
      adminVerifiedAt: new Date("2024-01-14"),
      createdAt: new Date("2024-01-10"),
    }));
    console.log("   ✅ Booking 1: ₹8,000 - PAID (can download invoice)");

    // Booking 2: PAID with discount ✅ (Can download invoice)
    bookings.push(await Booking.create({
      userId: user._id,
      listingId: listings[0]._id,
      roomType: "Single Room AC",
      moveInDate: new Date("2024-06-01"),
      duration: "12",
      fullName: userName,
      phoneNumber: userPhone,
      email: userEmail,
      address: {
        street: "123, MG Road",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400058",
      },
      status: "confirmed",
      paymentStatus: "completed_cash",
      paymentMethod: "cash",
      amount: 10800,
      originalAmount: 12000,
      discountAmount: 1200,
      securityDeposit: 24000,
      couponCode: "WELCOME10",
      termsAccepted: true,
      cashCollectedAt: new Date("2024-05-30"),
      adminVerifiedAt: new Date("2024-05-31"),
      createdAt: new Date("2024-05-25"),
    }));
    console.log("   ✅ Booking 2: ₹10,800 - PAID with 10% discount (can download invoice)");

    // Booking 3: Awaiting Cash
    bookings.push(await Booking.create({
      userId: user._id,
      listingId: listings[1]._id,
      roomType: "Shared Room",
      moveInDate: new Date("2024-12-15"),
      duration: "3",
      fullName: userName,
      phoneNumber: userPhone,
      email: userEmail,
      address: {
        street: "123, MG Road",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400058",
      },
      status: "confirmed",
      paymentStatus: "pending_cash_payment",
      paymentMethod: "cash",
      amount: 11000,
      originalAmount: 11000,
      discountAmount: 0,
      securityDeposit: 22000,
      termsAccepted: true,
      createdAt: new Date("2024-11-20"),
    }));
    console.log("   ✅ Booking 3: ₹11,000 - Awaiting Cash Payment");

    // Booking 4: Pending
    bookings.push(await Booking.create({
      userId: user._id,
      listingId: listings[0]._id,
      roomType: "Triple Sharing",
      moveInDate: new Date("2025-02-01"),
      duration: "6",
      fullName: userName,
      phoneNumber: userPhone,
      email: userEmail,
      address: {
        street: "123, MG Road",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400058",
      },
      status: "pending",
      paymentStatus: "pending",
      paymentMethod: "cash",
      amount: 6000,
      originalAmount: 6000,
      discountAmount: 0,
      securityDeposit: 12000,
      termsAccepted: true,
      createdAt: new Date(),
    }));
    console.log("   ✅ Booking 4: ₹6,000 - Pending Approval");

    // Booking 5: Cancelled
    bookings.push(await Booking.create({
      userId: user._id,
      listingId: listings[1]._id,
      roomType: "Private Studio",
      moveInDate: new Date("2024-03-01"),
      duration: "3",
      fullName: userName,
      phoneNumber: userPhone,
      email: userEmail,
      address: {
        street: "123, MG Road",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400058",
      },
      status: "cancelled",
      paymentStatus: "refunded",
      paymentMethod: "cash",
      amount: 18000,
      originalAmount: 18000,
      discountAmount: 0,
      securityDeposit: 36000,
      termsAccepted: true,
      createdAt: new Date("2024-02-15"),
    }));
    console.log("   ✅ Booking 5: ₹18,000 - Cancelled & Refunded");
    console.log("");

    // ========== CREATE SUPPORT TICKETS ==========
    console.log("🎫 Creating support tickets...");
    await SupportTicket.deleteMany({ userId: user._id });

    const tickets = [];

    // Ticket 1: Resolved
    tickets.push(await SupportTicket.create({
      ticketNumber: `TKT${Date.now()}01`,
      userId: user._id,
      listingId: listings[0]._id,
      bookingId: bookings[0]._id,
      category: "maintenance",
      priority: "high",
      subject: "AC not cooling properly",
      description: "The AC in my room is not cooling properly. Please send a technician.",
      status: "resolved",
      resolution: "Technician fixed the AC compressor issue.",
      resolvedAt: new Date("2024-01-20"),
      resolvedBy: owner._id,
      firstResponseAt: new Date("2024-01-18"),
      satisfactionRating: 4,
      assignedTo: owner._id,
      assignedToRole: "owner",
      comments: [
        {
          userId: owner._id,
          userRole: "owner",
          userName: owner.fullName || "Owner",
          message: "Technician will visit tomorrow 2-4 PM.",
          createdAt: new Date("2024-01-18"),
        },
        {
          userId: user._id,
          userRole: "user",
          userName: userName,
          message: "Thanks, I'll be available.",
          createdAt: new Date("2024-01-18T14:00:00"),
        },
      ],
      createdAt: new Date("2024-01-17"),
    }));
    console.log("   ✅ Ticket 1: AC Issue (Resolved)");

    // Ticket 2: In Progress
    tickets.push(await SupportTicket.create({
      ticketNumber: `TKT${Date.now()}02`,
      userId: user._id,
      listingId: listings[0]._id,
      category: "food_complaint",
      priority: "medium",
      subject: "Food quality issue",
      description: "Dinner quality has decreased. Rice is undercooked.",
      status: "in_progress",
      assignedTo: owner._id,
      assignedToRole: "owner",
      firstResponseAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      comments: [
        {
          userId: owner._id,
          userRole: "owner",
          userName: owner.fullName || "Owner",
          message: "We apologize and are taking corrective action.",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      ],
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    }));
    console.log("   ✅ Ticket 2: Food Quality (In Progress)");

    // Ticket 3: Open
    tickets.push(await SupportTicket.create({
      ticketNumber: `TKT${Date.now()}03`,
      userId: user._id,
      listingId: listings[0]._id,
      category: "wifi_internet",
      priority: "high",
      subject: "WiFi not working",
      description: "WiFi is down since morning. I have work meetings.",
      status: "open",
      comments: [],
      createdAt: new Date(),
    }));
    console.log("   ✅ Ticket 3: WiFi Issue (Open)");
    console.log("");

    // ========== CREATE NOTIFICATIONS ==========
    console.log("🔔 Creating notifications...");
    await Notification.deleteMany({ userId: user._id });

    await Notification.create({
      userId: user._id,
      type: "booking_approved",
      title: "Booking Confirmed!",
      message: `Your booking at ${listings[0].pgName} has been confirmed.`,
      relatedId: bookings[0]._id,
      relatedType: "booking",
      isRead: false,
      priority: "high",
    });

    await Notification.create({
      userId: user._id,
      type: "payment_reminder",
      title: "Rent Due Reminder",
      message: "Your rent is due in 3 days.",
      isRead: false,
      priority: "high",
    });

    await Notification.create({
      userId: user._id,
      type: "general",
      title: "Ticket Resolved",
      message: "Your AC complaint has been resolved.",
      relatedId: tickets[0]._id,
      isRead: false,
      priority: "medium",
    });

    console.log("   ✅ Created 3 notifications\n");

    // ========== SUMMARY ==========
    console.log("═".repeat(60));
    console.log("🎉 SEEDING COMPLETE!");
    console.log("═".repeat(60));
    console.log(`
    📧 User: ${userEmail}
    📁 Database: ${dbName}
    
    Created:
    ─────────────────────────────
    🏠 Listings:      ${listings.length}
    📋 Bookings:      ${bookings.length}
       • 2 Paid (can download invoice ✓)
       • 1 Awaiting Cash
       • 1 Pending Approval
       • 1 Cancelled
    🎫 Tickets:       ${tickets.length}
    🔔 Notifications: 3
    
    ═════════════════════════════════════════════════════════
    🧪 NOW TEST THESE PAGES:
    ═════════════════════════════════════════════════════════
    
    1. 💳 /routes/dashboard/user/payments
       → View payment history, download invoices
    
    2. 🏠 /routes/dashboard/user/move-in
       → Checklist, agreement, PG rules
    
    3. 🎫 /routes/dashboard/user/support
       → View tickets, create new tickets
    
    ═════════════════════════════════════════════════════════
    `);

    await mongoose.connection.close();
    console.log("✅ Done!\n");

  } catch (error) {
    console.error("\n❌ Error:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedExistingUserData();