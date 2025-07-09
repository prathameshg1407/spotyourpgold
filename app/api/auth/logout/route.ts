import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();

    cookieStore.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });

    return NextResponse.json({
      success: true,
      message: "User logged out successfully.",
    });
  } catch (error) {
    console.error("[LOGOUT_API]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to logout. (error)",
      },
    );
  }
}
