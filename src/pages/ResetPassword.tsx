import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/auth";

interface PolicyCheck {
  label: string;
  test: (p: string) => boolean;
}

const POLICY: PolicyCheck[] = [
  { label: "8+ characters", test: (p) => p.length >= 8 },
  { label: "Uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "Lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "Number", test: (p) => /\d/.test(p) },
  { label: "Special character", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const SEGMENT_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#34d399", "#10b981"];
const STRENGTH_LABELS: { label: string; textColor: string }[] = [
  { label: "Too weak", textColor: "#ef4444" },
  { label: "Weak", textColor: "#ef4444" },
  { label: "Fair", textColor: "#f97316" },
  { label: "Good", textColor: "#f59e0b" },
  { label: "Strong", textColor: "#34d399" },
  { label: "Excellent", textColor: "#10b981" },
];

function getStrength(password: string) {
  const passed = POLICY.filter((p) => p.test(password)).length;
  return { score: passed, ...(STRENGTH_LABELS[passed] || STRENGTH_LABELS[0]) };
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const strength = useMemo(() => getStrength(password), [password]);
  const allPassed = strength.score === POLICY.length;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-6">
        <div className="w-full max-w-[400px] text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: "'Google Sans', sans-serif" }}>
            Invalid reset link
          </h2>
          <p className="text-gray-500 text-[15px] mb-6">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link
            to="/forgot-password"
            className="inline-block px-6 py-2.5 text-sm font-semibold text-white rounded-xl transition-all"
            style={{ backgroundColor: "#4f46e5", boxShadow: "0 4px 14px rgba(79,70,229,0.25)" }}
          >
            Request new link
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allPassed) {
      setError("Please fix the password requirements below.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (msg?.toLowerCase().includes("expired") || msg?.toLowerCase().includes("invalid")) {
        setError("This reset link has expired. Please request a new one.");
      } else if (msg?.toLowerCase().includes("weak")) {
        setError(msg);
      } else {
        setError(msg || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-6">
        <div className="w-full max-w-[400px] text-center animate-[fadeIn_0.4s_ease-out]">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: "'Google Sans', sans-serif" }}>
            Password updated!
          </h2>
          <p className="text-gray-500 text-[15px] mb-6">
            Your password has been reset successfully. You can now sign in with your new password.
          </p>
          <Link
            to="/login"
            className="inline-block px-6 py-2.5 text-sm font-semibold text-white rounded-xl transition-all"
            style={{ backgroundColor: "#4f46e5", boxShadow: "0 4px 14px rgba(79,70,229,0.25)" }}
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-indigo-50/30 px-6">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M7 14l3-4 2.5 3 3.5-5 4 6H5z" fill="#a5b4fc"/>
              <circle cx="8.5" cy="8.5" r="2" fill="#e0e7ff"/>
            </svg>
          </div>
          <span className="text-xl font-semibold text-gray-800 tracking-tight">Pixelift</span>
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-[1.7rem] font-bold text-gray-900 tracking-tight" style={{ fontFamily: "'Google Sans', sans-serif" }}>
            Set new password
          </h1>
          <p className="text-gray-500 mt-1.5 text-[15px]">
            Choose a strong password for your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password */}
          <div>
            <label className="block text-[13px] text-gray-600 mb-1.5 font-medium">New password</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                required
                placeholder="Create a strong password"
                className="w-full pl-11 pr-11 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 transition-all placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 transition-colors"
              >
                {showPass
                  ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                }
              </button>
            </div>

            {/* Password strength bar + policy checklist */}
            {password.length > 0 && (
              <div className="mt-3 space-y-2.5 animate-[fadeIn_0.2s_ease-out]">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Strength</span>
                    <span className="text-[11px] font-semibold" style={{ color: strength.textColor }}>{strength.label}</span>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-1.5 flex-1 rounded-full transition-all duration-300"
                        style={{ backgroundColor: i < strength.score ? SEGMENT_COLORS[i] : "#e5e7eb" }}
                      />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  {POLICY.map((p) => {
                    const passed = p.test(password);
                    return (
                      <div key={p.label} className="flex items-center gap-1.5">
                        <div
                          className="w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all duration-200"
                          style={{ backgroundColor: passed ? "#10b981" : "#e5e7eb" }}
                        >
                          {passed && (
                            <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-[12px] transition-colors" style={{ color: passed ? "#047857" : "#9ca3af" }}>
                          {p.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-[13px] text-gray-600 mb-1.5 font-medium">Confirm password</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <input
                type={showPass ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                required
                placeholder="Re-enter your password"
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 transition-all placeholder:text-gray-400"
              />
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-[12px] text-red-500 mt-1.5">Passwords do not match</p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <span className="text-[13px]">{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !allPassed || password !== confirmPassword}
            className="w-full py-3 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            style={{
              backgroundColor: allPassed && password === confirmPassword ? "#4f46e5" : "#d1d5db",
              cursor: allPassed && password === confirmPassword ? "pointer" : "not-allowed",
              boxShadow: allPassed && password === confirmPassword ? "0 4px 14px rgba(79,70,229,0.25)" : "none",
            }}
          >
            {loading && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            )}
            {loading ? "Updating..." : "Reset password"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
