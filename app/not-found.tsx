import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NotFound() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (token) {
    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET!)
      );
      redirect("/"); // ✅ Safe: nothing returned after
    } catch (e) {
      console.error("JWT verify error:", e);
    }
  }

  redirect("/routes/auth/login"); // ✅ Safe
}
