"use client";
import authUser from "@/actions/authUser";
import { useLoadingStore } from "@/store/loading";
import { useUserStore } from "@/store/userStore";
import axios from "axios";
import { useEffect } from "react";

const AuthProvider = () => {
  const { setLoading } = useLoadingStore();
  const { setUser } = useUserStore();

  useEffect(() => {
    setLoading(true);

  // console.log("auth provider");

    (async () => {
      try {
        const tokenUser = await authUser();
        const res = await axios.get("/api/auth/getuser");
        const user = res?.data?.user ?? null;
        if (user?.role !== tokenUser?.role) {
         const res = await axios.post("/api/auth/refresh-token",{
            id: user?.id,
            fullName: user?.fullName,
            role: user?.role,
          });
        }
        setUser(user);
      } catch (error) {
        console.error("Failed to fetch user", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      setLoading(false);
    };
  }, [setLoading, setUser]);

  return null;
};

export default AuthProvider;
