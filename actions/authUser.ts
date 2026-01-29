// actions/authUser.ts
"use server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET!;
const secret = new TextEncoder().encode(JWT_SECRET);

const authUser = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);

    return payload as {
      id: string;
      fullName: string;
      role: string;
      email: string;  // ✅ Added email field
    };
  } catch (err) {
    return null;
  }
};

export { authUser };
export default authUser;