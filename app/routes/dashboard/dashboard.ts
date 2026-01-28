// app/routes/dashboard/dashboard.ts
// Dashboard utility functions and data

import { NavItem } from "@/components/sidebar";

export type UserRole = "user" | "owner" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface PGListing {
  id: string;
  name: string;
  ownerId: string;
  location: string;
  rent: number;
  amenities: string[];
  rules: string[];
  images: string[];
  featured: boolean;
  status: "active" | "pending" | "rejected";
  createdAt: string;
  geolocation: {
    lat: number;
    lng: number;
  };
}

export interface Booking {
  id: string;
  userId: string;
  pgId: string;
  checkIn: string;
  checkOut: string;
  status: "confirmed" | "pending" | "cancelled";
  amount: number;
}

export interface Review {
  id: string;
  userId: string;
  pgId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface OwnerRequest {
  id: string;
  userId: string;
  documents: string[];
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
}

export interface Ticket {
  id: string;
  oderId: string;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed" | "escalated";
  priority: "low" | "medium" | "high" | "urgent";
  category: string;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderRole: "user" | "owner" | "admin";
  message: string;
  createdAt: string;
}

// Navigation items for different roles
export const getNavigationItems = (role: UserRole): NavItem[] => {
  const baseItems: NavItem[] = [
    { name: "Dashboard", href: "/routes/dashboard", icon: "LayoutDashboard" },
  ];

  switch (role) {
    case "user":
      return [
        ...baseItems,
        {
          name: "My Room",
          href: "/routes/dashboard/user/my-room",
          icon: "Home",
        },
        {
          name: "Visit Requests",
          href: "/routes/dashboard/user/visit-requests",
          icon: "Calendar",
        },
        {
          name: "Payments",
          href: "/routes/dashboard/user/payments",
          icon: "CreditCard",
        },
        {
          name: "Move-in Support",
          href: "/routes/dashboard/user/move-in",
          icon: "Home",
        },
        {
          name: "Support",
          href: "/routes/dashboard/user/support",
          icon: "Headphones",
        },
        {
          name: "My Reviews",
          href: "/routes/dashboard/user/reviews",
          icon: "Star",
        },
        {
          name: "Favorites",
          href: "/routes/dashboard/user/favorites",
          icon: "Heart",
        },
        {
          name: "Profile",
          href: "/routes/dashboard/user/profile",
          icon: "User",
        },
      ];

    case "owner":
      return [
        ...baseItems,
        {
          name: "My Listings",
          href: "/routes/dashboard/owners/listings",
          icon: "Building",
        },
        {
          name: "Add New PG",
          href: "/routes/dashboard/owners/add-pg",
          icon: "Plus",
        },
        {
          name: "Room Management",
          href: "/routes/dashboard/owners/room-management",
          icon: "Bed",
        },
        {
          name: "Room Allocation",
          href: "/routes/dashboard/owners/room-allocation",
          icon: "Bed",
        },
        {
          name: "Visit Requests",
          href: "/routes/dashboard/owners/visit-requests",
          icon: "Calendar",
        },
        {
          name: "Booking Requests",
          href: "/routes/dashboard/owners/booking-requests",
          icon: "UserCheck",
        },
        {
          name: "Support Tickets",
          href: "/routes/dashboard/owners/tickets",
          icon: "Headphones",
        },
        {
          name: "Subscription",
          href: "/routes/dashboard/owners/subscription",
          icon: "Crown",
        },
        {
          name: "Profile",
          href: "/routes/dashboard/owners/profile",
          icon: "User",
        },
      ];

    case "admin":
      return [
        ...baseItems,
        {
          name: "Owner Requests",
          href: "/routes/dashboard/admin/owner-management",
          icon: "UserCheck",
        },
        {
          name: "All Listings",
          href: "/routes/dashboard/admin/listings",
          icon: "Building2",
        },
        {
          name: "Booking Requests",
          href: "/routes/dashboard/admin/booking-requests",
          icon: "Calendar",
        },
        {
          name: "Cash Payments",
          href: "/routes/dashboard/admin/cash-payments",
          icon: "DollarSign",
        },
        {
          name: "Commissions",
          href: "/routes/dashboard/admin/commissions",
          icon: "TrendingUp",
        },
        {
          name: "Coupon Management",
          href: "/routes/dashboard/admin/coupons",
          icon: "Megaphone",
        },
        {
          name: "Visit Requests",
          href: "/routes/dashboard/admin/visit-requests",
          icon: "Calendar",
        },
        {
          name: "Support Tickets",
          href: "/routes/dashboard/admin/tickets",
          icon: "Headphones",
        },
        {
          name: "My Listings",
          href: "/routes/dashboard/owners/listings",
          icon: "Building",
        },
        {
          name: "Add New PG",
          href: "/routes/dashboard/owners/add-pg",
          icon: "Plus",
        },
        {
          name: "Room Management",
          href: "/routes/dashboard/owners/room-management",
          icon: "Bed",
        },
        {
          name: "Room Allocation",
          href: "/routes/dashboard/owners/room-allocation",
          icon: "Bed",
        },
        {
          name: "Favorites",
          href: "/routes/dashboard/admin/favorites",
          icon: "Heart",
        },
      ];

    default:
      return baseItems;
  }
};

// Statistics functions
export const getUserStats = () => ({
  totalBookings: 0,
  activeBookings: 0,
  totalReviews: 0,
  favoritesPGs: 0,
});

export const getOwnerStats = () => ({
  totalListings: 0,
  activeListings: 0,
  featuredListings: 0,
  totalRevenue: 0,
  monthlyRevenue: 0,
  totalReviews: 0,
  averageRating: 0,
  pendingVisitRequests: 0,
  totalWishlist: 0,
  openTickets: 0,
});

export const getAdminStats = () => ({
  totalUsers: 0,
  totalOwners: 0,
  totalListings: 0,
  pendingRequests: 0,
  monthlyRevenue: 0,
  featuredListings: 0,
  openTickets: 0,
  escalatedTickets: 0,
});