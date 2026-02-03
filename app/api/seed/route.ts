import { NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import User from "@/models/user";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await connectToDB();

    const email = "sarveshbhoite2828@gmail.com";
    const rawPassword = "Raj#123";
    
    // 1. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // Update existing user to be an admin
      existingUser.password = hashedPassword;
      existingUser.role = "admin";
      existingUser.ownerStatus = "verified"; // Optional: make them a verified owner too
      await existingUser.save();
      
      return NextResponse.json({
        success: true,
        message: "Existing user updated to Admin successfully.",
        user: { email: existingUser.email, role: existingUser.role }
      });
    }

    // 3. Create new Admin User if not exists
    const newUser = new User({
      fullName: "Super Admin", // Placeholder name
      email: email,
      password: hashedPassword,
      phone: "9999999999", // Placeholder phone (Required by schema)
      role: "admin",
      ownerStatus: "verified",
      watchlist: [],
    });

    await newUser.save();

    return NextResponse.json({
      success: true,
      message: "New Admin user created successfully.",
      user: { email: newUser.email, role: newUser.role }
    });

  } catch (error: any) {
    console.error("Seeding Error:", error);
    return NextResponse.json(
      { success: false, message: "Error seeding admin", error: error.message },
      { status: 500 }
    );
  }
}