"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function FranchiseLogin() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referCode, setReferCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/franchise-panel/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, referCode }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      setError(data.message);
      setLoading(false);
      return;
    }

    localStorage.setItem("franchise_token", data.token);
    localStorage.setItem("franchise_user", JSON.stringify(data.user));
    router.push("/franchise-panel/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl space-y-5"
      >
        <h1 className="text-2xl font-bold text-center">Franchise Login</h1>

        {error && (
          <div className="text-red-600 bg-red-50 p-2 rounded text-sm">
            {error}
          </div>
        )}

        <input
          type="email"
          required
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-3 rounded-xl"
        />

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border p-3 rounded-xl pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-3"
          >
            {showPassword ? <EyeOff /> : <Eye />}
          </button>
        </div>

        {/* <input
          type="text"
          required
          placeholder="Referral Code (Limbu25)"
          onChange={(e) => setReferCode(e.target.value)}
          className="w-full border p-3 rounded-xl"
        /> */}

        <button
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded-xl flex justify-center"
        >
          {loading ? <Loader2 className="animate-spin" /> : "Login"}
        </button>
      </form>
    </div>
  );
}
