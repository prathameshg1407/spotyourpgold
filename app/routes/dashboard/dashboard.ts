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

// Mock data
export const mockUser: User = {
  id: "1",
  name: "John Doe",
  email: "john@example.com",
  role: "admin", // Change this to test different roles: 'user', 'owner', 'admin'
};

export const mockPGListings: PGListing[] = [
  {
    id: "1",
    name: "Cozy Downtown PG",
    ownerId: "2",
    location: "Mumbai, Maharashtra",
    rent: 15000,
    amenities: ["WiFi", "AC", "Laundry", "Kitchen"],
    rules: ["No smoking", "No pets", "Quiet hours 10 PM - 7 AM"],
    images: ["/placeholder.svg?height=200&width=300"],
    featured: true,
    status: "active",
    createdAt: "2024-01-15",
    geolocation: { lat: 19.076, lng: 72.8777 },
  },
  {
    id: "2",
    name: "Student Friendly PG",
    ownerId: "3",
    location: "Pune, Maharashtra",
    rent: 12000,
    amenities: ["WiFi", "Study Room", "Mess", "Security"],
    rules: ["Students only", "No visitors after 9 PM"],
    images: ["/placeholder.svg?height=200&width=300"],
    featured: false,
    status: "active",
    createdAt: "2024-01-20",
    geolocation: { lat: 18.5204, lng: 73.8567 },
  },
];

export const mockBookings: Booking[] = [
  {
    id: "1",
    userId: "1",
    pgId: "1",
    checkIn: "2024-02-01",
    checkOut: "2024-02-28",
    status: "confirmed",
    amount: 15000,
  },
];

export const mockReviews: Review[] = [
  {
    id: "1",
    userId: "1",
    pgId: "1",
    rating: 4,
    comment: "Great place to stay, very clean and well-maintained.",
    createdAt: "2024-01-25",
  },
];

export const mockOwnerRequests: OwnerRequest[] = [
  {
    id: "1",
    userId: "4",
    documents: ["aadhar.pdf", "pan.pdf", "property_papers.pdf"],
    status: "pending",
    submittedAt: "2024-01-30",
  },
];

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
          name: "Visit Requests",
          href: "/routes/dashboard/user/visit-requests",
          icon: "Calendar",
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
        // { name: "Add New PG", href: "/add-pg", icon: "Plus" },
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
          name: "Visit Requests",
          href: "/routes/dashboard/owners/visit-requests",
          icon: "Calendar",
        },
        // { name: "Bookings", href: "/owner-bookings", icon: "Calendar" },
        // { name: "Analytics", href: "/analytics", icon: "BarChart3" },
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
        // { name: "Payments", href: "/payments", icon: "CreditCard" },
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
          name: "Visit Requests",
          href: "/routes/dashboard/admin/visit-requests",
          icon: "Calendar",
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
          name: "favorites",
          href: "/routes/dashboard/admin/favorites",
          icon: "Heart",
        },
        // { name: "User Management", href: "/users", icon: "Users" },
        // { name: "Featured Requests", href: "/featured-requests", icon: "Star" },
        // { name: "Ad Management", href: "/ads", icon: "Megaphone" },
        // { name: "Analytics", href: "/admin-analytics", icon: "TrendingUp" },
        // { name: "Payments", href: "/admin-payments", icon: "Wallet" },
        // { name: "Settings", href: "/settings", icon: "Settings" },
      ];

    default:
      return baseItems;
  }
};

// Statistics functions
export const getUserStats = () => ({
  totalBookings: 5,
  activeBookings: 2,
  totalReviews: 8,
  favoritesPGs: 12,
});

export const getOwnerStats = () => ({
  totalListings: 3,
  activeListings: 2,
  featuredListings: 1,
  totalRevenue: 0,
  monthlyRevenue: 0,
  totalReviews: 24,
  averageRating: 4.2,
  pendingVisitRequests: 5,
  totalWishlist: 12,
});

export const getAdminStats = () => ({
  totalUsers: 1284,
  totalOwners: 156,
  totalListings: 342,
  pendingRequests: 24,
  monthlyRevenue: 125000,
  featuredListings: 45,
});
