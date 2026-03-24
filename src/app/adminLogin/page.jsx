"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const login = async () => {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    console.log("datadata",data);
    

    if (!res.ok) {
      alert(data.message);
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role);
    localStorage.setItem("permissions", JSON.stringify(data.permissions));
    localStorage.setItem("adminName", data.fullName);
    localStorage.setItem("email", data.email);
    localStorage.setItem("adminId", data.adminId);

    if (["superFranchiseAdmin", "franchiseAdmin"].includes(data.role)) {
      router.push("/admin/franchise/franchise-lead");
    } else {
      router.push("/admin/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-slate-900 to-black px-4">
      
      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20">
        
        <h2 className="text-3xl font-bold text-center text-white mb-2">
          Admin Login
        </h2>
        <p className="text-center text-gray-300 mb-6 text-sm">
          Sign in to access the dashboard
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300">Email</label>
            <input
              type="email"
              placeholder="admin@example.com"
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 px-4 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm text-gray-300">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 px-4 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={login}
            className="w-full py-2 mt-4 bg-blue-600 hover:bg-blue-700 transition rounded-lg text-white font-semibold shadow-lg"
          >
            Login
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} Admin Panel
        </p>
      </div>
    </div>
  );
}
