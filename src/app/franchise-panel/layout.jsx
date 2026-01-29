"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./page";

export default function FranchiseLayout({ children }) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("franchise_token");
    if (!token) {
      router.push("/franchise-panel/login");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
