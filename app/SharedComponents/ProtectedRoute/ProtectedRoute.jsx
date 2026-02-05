"use client"
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

const ProtectedRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const userId = localStorage.getItem("userId");

      if (!userId) {
        toast.error("You must be logged in to access this page");

        // defer redirect + state update to avoid cascading render
        setTimeout(() => {
          router.push("/"); // login page redirect
        }, 0);
      } else {
        setIsLoading(false); // safe, only when user exists
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600 text-lg">Checking authentication...</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
