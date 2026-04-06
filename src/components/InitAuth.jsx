"use client";

import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect } from "react";

export default function InitAuth() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, []);

  return null;
}