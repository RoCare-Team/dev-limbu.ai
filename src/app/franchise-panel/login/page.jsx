"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function FranchiseLogin() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    console.log("datadata",data);
    

    if (!res.ok || !data.success) {
      setError(data.message || "Login failed");
      setLoading(false);
      return;
    }

    const franchiseCode =
      data.user.franchiseCode || data.user.franchiseId || "";
    const loginUser = {
      ...data.user,
      franchiseCode,
      agentReferralCode: data.user.agentReferralCode || data.user.referralCode || "",
    };
    localStorage.setItem("franchise_token", data.token);
    localStorage.setItem(
      "franchise_user",
      JSON.stringify(loginUser),
    );
    localStorage.setItem("franchise_code", franchiseCode);
    router.push("/franchise-panel/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black px-4 relative overflow-hidden">
      
      {/* Background Glow Effect */}
      <div className="absolute w-96 h-96 bg-green-500/20 blur-3xl rounded-full top-[-100px] left-[-100px]" />
      <div className="absolute w-96 h-96 bg-lime-400/20 blur-3xl rounded-full bottom-[-100px] right-[-100px]" />

      <form
        onSubmit={handleSubmit}
        className="relative backdrop-blur-xl bg-white/10 border border-white/20 w-full max-w-md p-8 rounded-3xl shadow-2xl space-y-6"
      >
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white">
            Limbu AI
          </h1>
          <p className="text-gray-300 text-sm">
            Franchise Panel Login
          </p>
        </div>

        {error && (
          <div className="text-red-400 bg-red-500/10 border border-red-400/30 p-3 rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        {/* Email */}
        <div className="space-y-1">
          <label className="text-gray-300 text-sm">Email</label>
          <input
            type="email"
            required
            placeholder="Enter your email"
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-400 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>

        {/* Password */}
        <div className="space-y-1 relative">
          <label className="text-gray-300 text-sm">Password</label>
          <input
            type={showPassword ? "text" : "password"}
            required
            placeholder="Enter your password"
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-400 p-3 rounded-xl pr-12 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-[38px] text-gray-300 hover:text-white"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Login Button */}
        <button
          disabled={loading}
          className="w-full bg-white hover:bg-white-600 transition-all duration-300 text-black font-semibold py-3 rounded-xl flex justify-center items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin w-5 h-5" />
              Logging in...
            </>
          ) : (
            "Login to Dashboard"
          )}
        </button>

        <p className="text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Limbu AI. All rights reserved.
        </p>
      </form>
    </div>
  );
}
