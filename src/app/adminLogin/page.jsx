"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [loginType, setLoginType] = useState("admin"); // admin | franchise

  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          password,
          loginType 
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.message || "Invalid login");
        return;
      }

      localStorage.setItem("role", data.role);
      localStorage.setItem("adminToken", data.token);

      // 🔀 Redirect based on role
      if (data.role === "franchiseAdmin") {
        router.push("/admin/franchise/dashboard");
      } else {
        router.push("/admin/dashboard");
      }

    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100"
      >
        {/* Toggle */}
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setLoginType("admin")}
            className={`w-1/2 py-2 rounded-lg text-sm font-medium transition ${
              loginType === "admin"
                ? "bg-blue-600 text-white shadow"
                : "text-gray-600"
            }`}
          >
            Admin Login
          </button>

          <button
            type="button"
            onClick={() => setLoginType("franchise")}
            className={`w-1/2 py-2 rounded-lg text-sm font-medium transition ${
              loginType === "franchise"
                ? "bg-blue-600 text-white shadow"
                : "text-gray-600"
            }`}
          >
            Franchise Admin
          </button>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-semibold text-center mb-6 text-gray-800">
          {loginType === "admin" ? "Admin Login" : "Franchise Admin Login"}
        </h2>

        {error && (
          <p className="text-red-500 text-sm mb-4 text-center bg-red-50 p-2 rounded-lg">
            {error}
          </p>
        )}

        {/* Email */}
        <div className="mb-5">
          <label className="block text-gray-700 font-medium mb-2">
            {loginType === "admin" ? "Admin Email" : "Franchise Email"}
          </label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>

        {/* Password */}
        <div className="mb-6 relative">
          <label className="block text-gray-700 font-medium mb-2">
            {loginType === "admin" ? "Admin Password" : "Franchise Password"}
          </label>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-10 -translate-y-1/2 text-gray-500"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {/* Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition shadow-md"
        >
          {loading
            ? "Logging in..."
            : loginType === "admin"
            ? "Login as Admin"
            : "Login as Franchise Admin"}
        </button>
      </form>
    </div>
  );
}
