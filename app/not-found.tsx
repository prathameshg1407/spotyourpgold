import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NotFound() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  // Check if user is authenticated
  let isAuthenticated = false;
  if (token) {
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET!));
      isAuthenticated = true;
    } catch (e) {
      console.error("JWT verify error:", e);
      isAuthenticated = false;
    }
  }

  // Redirect based on authentication status
  if (isAuthenticated) {
    redirect("/");
  } else {
    redirect("/routes/auth/login");
  }

  // This should never be reached due to redirects above
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-gray-600 mb-8">Page not found</p>
        <Link
          href={isAuthenticated ? "/" : "/routes/auth/login"}
          className="text-blue-600 hover:text-blue-800"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}
