// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";
// import authUser from "./actions/authUser";

// const PUBLIC_ROUTES = ["/", "/routes/auth/login", "/routes/auth/signup"];
// const PROTECTED_ROUTES = ["/dashboard", "/profile", "/settings"];
// const ADMIN_ROUTES = ["/admin"];
// const OWNER_ROUTES = ["/owner"];

// export async function middleware(request: NextRequest) {
//   const { pathname } = request.nextUrl;
//   const token = request.cookies.get("token")?.value;

//   const isProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
//   const isAdmin = ADMIN_ROUTES.some(route => pathname.startsWith(route));
//   const isOwner = OWNER_ROUTES.some(route => pathname.startsWith(route));
//   const isAuthPage = pathname === "/routes/auth/login" || pathname === "/routes/auth/signup";

//   const isOwnerRegister = pathname === "/routes/owners/onboarding";

//   if (!token && (isProtected || isAdmin || isOwner)) {
//     return NextResponse.redirect(new URL("/routes/auth/login", request.url));
//   }

//   if (token) {
//     try {
//       const user = await authUser();

//       if (isAuthPage) {
//         return NextResponse.redirect(new URL("/", request.url));
//       }

//       if (isAdmin && user?.role !== "admin") {
//         return NextResponse.redirect(new URL("/unauthorized", request.url));
//       }

//       if (isOwner && user?.role !== "owner") {
//         return NextResponse.redirect(new URL("/unauthorized", request.url));
//       }

//       // if (isOwnerRegister && user?.role !== "user") {
//       //   return NextResponse.redirect(new URL("/", request.url));
//       // }

//     } catch (err) {
//       console.error("Invalid token:", err);
//       const res = NextResponse.redirect(new URL("/", request.url));
//       res.cookies.delete("token");
//       return res;
//     }
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
// };

import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Route patterns
const PUBLIC_ROUTES = ["/", "/routes/auth/login", "/routes/auth/signup"];
const PROTECTED_ROUTES = ["/routes/dashboard", "/profile", "/routes/watchlist"];
const ADMIN_ROUTES = ["/admin"];
const OWNER_ROUTES = ["/owner"];
const OWNER_ONBOARDING_ROUTE = "/routes/owners/onboarding";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));
  const isOwnerRoute = OWNER_ROUTES.some((route) => pathname.startsWith(route));
  const isOwnerOnboarding = pathname.startsWith(OWNER_ONBOARDING_ROUTE);

  // ✅ If no token and accessing protected/admin/owner/onboarding
  if (
    !token &&
    (isProtectedRoute || isAdminRoute || isOwnerRoute || isOwnerOnboarding)
  ) {
    return NextResponse.redirect(new URL("/routes/auth/login", request.url));
  }

  // ✅ If token exists
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

      const { payload } = await jwtVerify(token, secret);

      const user = payload as {
        id: string;
        fullName: string;
        role: string;
      };

      // 🔐 Prevent logged-in users from visiting login/signup
      if (pathname.startsWith("/routes/auth")) {
        return NextResponse.redirect(new URL("/", request.url));
      }

      // 🔐 Only owners allowed in /owner/*
      if (isOwnerRoute && user && user?.role !== "owner") {
        return NextResponse.redirect(new URL("/", request.url));
      }

      // 🔐 Only admins allowed in /admin/*
      if (isAdminRoute && user && user?.role !== "admin") {
        return NextResponse.redirect(new URL("/", request.url));
      }

      // 🔐 Only unpromoted users can go to onboarding
      if (isOwnerOnboarding && user && user?.role === "owner") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch (err) {
      console.error("Invalid token:", err);
      const res = NextResponse.redirect(
        new URL("/routes/auth/login", request.url)
      );
      // res.cookies.delete("token");
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
