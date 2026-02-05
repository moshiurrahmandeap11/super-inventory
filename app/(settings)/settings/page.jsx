"use client";
import axiosInstance from "@/app/SharedComponents/AxiosInstance/AxiosInstance";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

const Settings = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const userId = localStorage.getItem("userId");

        // 🚫 Not logged in
        if (!userId) {
          toast.error("Login required");
          router.push("/");
          return;
        }

        const res = await axiosInstance.get(`/users/${userId}`);
        const user = res.data.data;

        // 🎭 Role based redirect
        switch (user?.role) {
          case "admin":
            router.push("/settings/admin");
            return;

          case "manager":
            router.push("/settings/manager");
            return;

          default:
            setLoading(false); // normal user stays
        }

      } catch (error) {
        console.error("Role check failed:", error);
        toast.error("Session expired");
        router.push("/");
      }
    };

    checkRole();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 text-lg">Checking permissions...</p>
      </div>
    );
  }

  return (
    <div className="p-6 text-xl font-semibold">
      This is Settings Page (User)
    </div>
  );
};

export default Settings;
