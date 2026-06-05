import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET() {
  const envStatus: Record<string, string> = {};
  
  const varsToCheck = [
    "MONGODB_URI",
    "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
    "JWT_SECRET",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "EMAIL_USER",
    "EMAIL_PASS",
    "ADMIN_EMAIL",
    "CRON_SECRET",
    "AISENSY_API_KEY",
    "AISENSY_PROJECT_ID",
    "AISENSY_PROJECT_API_PWD",
    "AISENSY_API_PASSWORD",
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "NEXT_PUBLIC_RAZORPAY_KEY_ID",
    "NODE_ENV"
  ];

  varsToCheck.forEach((v) => {
    const val = process.env[v];
    if (!val) {
      envStatus[v] = "MISSING (undefined or empty)";
    } else {
      envStatus[v] = `SET (length: ${val.length})`;
    }
  });

  let dbConnectionStatus = "NOT TESTED";
  let dbError = null;

  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri) {
    try {
      // Attempt to establish a test connection to MongoDB
      const conn = await mongoose.createConnection(mongoUri, {
        dbName: "sypg",
        serverSelectionTimeoutMS: 5000, // 5 seconds timeout for faster response
      }).asPromise();
      
      dbConnectionStatus = "SUCCESSFULLY CONNECTED";
      await conn.close();
    } catch (err: any) {
      dbConnectionStatus = "FAILED TO CONNECT";
      dbError = err?.message || String(err);
    }
  } else {
    dbConnectionStatus = "FAILED (MONGODB_URI is missing)";
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    status: "ok",
    environmentVariables: envStatus,
    databaseConnection: {
      status: dbConnectionStatus,
      error: dbError,
    }
  });
}