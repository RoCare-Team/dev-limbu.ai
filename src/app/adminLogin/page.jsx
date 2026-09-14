"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  const login = async (e) => {
    // Form submit — so pressing Enter in either field logs in too.
    e?.preventDefault();
    if (loading) return;

    try {
      if (!email || !password) {
        setError("Please enter email & password");
        return;
      }

      setError("");
      setLoading(true);

      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed");
        setLoading(false);
        return;
      }

      // 🔥 SAVE DATA
      localStorage.setItem("token", data.token || "");
      localStorage.setItem("role", data.role || "");
      localStorage.setItem("permissions", JSON.stringify(data.permissions || []));
      localStorage.setItem("adminName", data.fullName || "");
      // `email` sirf backward-compat ke liye. Asli admin identity `adminEmail`
      // hai — kyunki impersonation (/impersonate-login) usi origin ke localStorage
      // me `email` ko impersonated user ke email se overwrite kar deta hai, aur
      // admin panel ki saari calls galat email bhejne lagti thi (aur admin ko
      // dobara login karna padta tha).
      localStorage.setItem("email", data.email || "");
      localStorage.setItem("adminEmail", data.email || "");
      localStorage.setItem("adminId", data.adminId || "");

      // 🔥 REDIRECT
      //
      // `?returnTo=/kuch/path` ho to login ke baad wahin bhejo. Ye un pages ke
      // liye hai jo khud admin-login ke peeche nahi hain par admin token maangte
      // hain — jaise /automation-logs ka "Reconnect GMB" button. Uske bina banda
      // login karke dashboard par pahunch jaata tha aur use khud wapas jaana
      // padta tha.
      //
      // Sirf same-origin PATH allow hai ("/..." se shuru, "//" nahi) — warna ye
      // ek open-redirect ban jaata (login ke baad kisi bahar ki site par bhej
      // dena).
      // `useSearchParams()` jaan-boojhkar nahi — App Router me wo Suspense
      // boundary maangta hai. Ye code submit handler ke andar hai, yaani hamesha
      // browser me chalta hai, isliye window se padhna hi kaafi aur safe hai.
      const rawReturnTo =
        new URLSearchParams(window.location.search).get("returnTo") || "";
      const returnTo =
        rawReturnTo.startsWith("/") && !rawReturnTo.startsWith("//") ? rawReturnTo : "";

      if (returnTo) {
        router.push(returnTo);
      } else if (["superFranchiseAdmin", "franchiseAdmin"].includes(data.role)) {
        router.push("/admin/franchise/franchise-lead");
      } else {
        router.push("/admin/dashboard");
      }
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const trackCapsLock = (e) => {
    if (typeof e.getModifierState === "function") {
      setCapsLockOn(e.getModifierState("CapsLock"));
    }
  };

  const inputBase =
    "w-full rounded-xl border bg-white/[0.04] py-3 pl-11 text-[15px] text-white placeholder-slate-500 outline-none transition focus:bg-white/[0.07] focus:ring-4 disabled:opacity-60";
  const inputTone = error
    ? "border-red-400/50 focus:border-red-400 focus:ring-red-500/15"
    : "border-white/10 focus:border-[#EAB308]/70 focus:ring-[#EAB308]/15";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b14] px-4 py-10 flex items-center justify-center">
      {/* Background: soft brand glow + faint grid */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#EAB308]/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-48 -right-32 h-[420px] w-[420px] rounded-full bg-blue-600/20 blur-[120px]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />

      <div className="relative w-full max-w-[420px]">
        {/* Brand */}
        <div className="mb-6 flex flex-col items-center">
          <div className="flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-lg shadow-black/30">
              <Image src="/images/bg-logo.png" width={30} height={30} alt="Limbu AI" priority />
            </div>
            <span className="text-2xl font-extrabold uppercase tracking-tight text-white">
              Limbu<span className="text-[#EAB308]">.ai</span>
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-7 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
          <div className="mb-7 text-center">
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#EAB308]/30 bg-[#EAB308]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#EAB308]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin Panel
            </span>
            <h1 className="text-2xl font-bold text-white">Welcome back</h1>
            <p className="mt-1 text-sm text-slate-400">Sign in to access the dashboard</p>
          </div>

          <form onSubmit={login} className="space-y-5" noValidate>
            {/* EMAIL */}
            <div>
              <label htmlFor="admin-email" className="mb-1.5 block text-sm font-medium text-slate-300">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-500" />
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  autoFocus
                  placeholder="admin@example.com"
                  value={email}
                  disabled={loading}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  className={`${inputBase} ${inputTone} pr-4`}
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <label htmlFor="admin-password" className="mb-1.5 block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-500" />
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  disabled={loading}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  onKeyDown={trackCapsLock}
                  onKeyUp={trackCapsLock}
                  onBlur={() => setCapsLockOn(false)}
                  className={`${inputBase} ${inputTone} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  title={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EAB308]/60"
                >
                  {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>
              {capsLockOn && (
                <p className="mt-1.5 text-xs font-medium text-amber-300">Caps Lock is on</p>
              )}
            </div>

            {/* ERROR */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-200"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
                <span>{error}</span>
              </div>
            )}

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#EAB308] py-3 text-[15px] font-bold text-black shadow-lg shadow-[#EAB308]/20 transition hover:brightness-105 hover:shadow-[#EAB308]/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Login
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Authorized staff only · © {new Date().getFullYear()} Limbu AI
        </p>
      </div>
    </div>
  );
}
