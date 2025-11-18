import { useState, useEffect } from "react";
import axios from "axios";

interface OwnerMetrics {
  totalListings: number;
  activeListings: number;
  featuredListings: number;
  totalRevenue: number;
  totalReviews: number;
  averageRating: number;
  pendingVisitRequests: number;
  pendingBookingRequests: number;
  monthlyRevenue: number;
  totalWishlist: number;
}

interface AdminMetrics {
  totalUsers: number;
  totalOwners: number;
  totalListings: number;
  pendingRequests: number;
  pendingListings: number;
  featuredListings: number;
  pendingVisitRequests: number;
  monthlyRevenue: number;
}

interface UserMetrics {
  totalWatchlist: number;
  totalReviews: number;
  totalVisitRequests: number;
  totalBookings: number;
}

type DashboardMetrics = OwnerMetrics | AdminMetrics | UserMetrics;

export const useDashboardMetrics = (role: string, userId?: string) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({ role });
        if (userId) {
          params.append("userId", userId);
        }

        const url = `/api/dashboard/metrics?${params}`;

        const response = await axios.get(url);

        if (response.data.success) {
          setMetrics(response.data.data);
        } else {
          setError(response.data.message || "Failed to fetch metrics");
        }
      } catch (err) {
        setError("Failed to fetch dashboard metrics");
      } finally {
        setLoading(false);
      }
    };

    if (role) {
      fetchMetrics();
    }
  }, [role, userId]);

  return {
    metrics,
    loading,
    error,
    refetch: () => {
      if (role) {
        const fetchMetrics = async () => {
          try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams({ role });
            if (userId) {
              params.append("userId", userId);
            }

            const response = await axios.get(
              `/api/dashboard/metrics?${params}`
            );

            if (response.data.success) {
              setMetrics(response.data.data);
            } else {
              setError(response.data.message || "Failed to fetch metrics");
            }
          } catch (err) {
            setError("Failed to fetch dashboard metrics");
          } finally {
            setLoading(false);
          }
        };
        fetchMetrics();
      }
    },
  };
};
