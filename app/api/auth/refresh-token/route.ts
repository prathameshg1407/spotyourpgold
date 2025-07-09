// /api/auth/refresh-token
import { SignJWT } from "jose";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { id, fullName, role } = await req.json();

  if (!id || !fullName || !role) {
    return NextResponse.json(
      { success: false, message: "Missing user data." },
      { status: 400 }
    );
  }

  const JWT_SECRET = process.env.JWT_SECRET!;
  const secret = new TextEncoder().encode(JWT_SECRET);

  const token = await new SignJWT({ id, fullName, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(secret);

  const response = NextResponse.json({ success: true });

  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day
  });

  return response;
}
