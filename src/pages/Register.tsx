import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api/auth";

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

// Segment colors by index — uses inline styles to avoid Tailwind purge issues
const SEGMENT_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#34d399", "#10b981"]; // red, orange, amber, emerald-400, emerald-500
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

const SAMPLE_IMAGES = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=280&q=80",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=280&q=80",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=280&q=80",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=280&q=80",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=280&q=80",
  "https://images.unsplash.com/photo-1518173946687-a1e3e1433519?w=280&q=80",
];

const FEATURES = [
  {
    icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
    title: "Smart Compression",
    desc: "Auto-optimized with zero quality loss",
  },
  {
    icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
    title: "10+ Transforms",
    desc: "Grayscale, sepia, blur, resize, watermark & more",
  },
  {
    icon: "M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z",
    title: "1 GB Cloud Storage",
    desc: "CDN-backed delivery worldwide",
  },
];

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const strength = useMemo(() => getStrength(form.password), [form.password]);
  const allPassed = strength.score === POLICY.length;

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const updated = { ...form, [e.target.name]: e.target.value };
    setForm(updated);
    // Only clear error once password policy is fully satisfied
    if (error && getStrength(updated.password).score === POLICY.length) {
      setError("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allPassed) {
      setError("Please fix the password requirements highlighted below.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await register(form.email, form.password, form.firstName, form.lastName);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (msg?.toLowerCase().includes("email already exists")) {
        setError("This email is already registered. Try signing in instead.");
      } else if (msg?.toLowerCase().includes("weak")) {
        setError(msg);
      } else {
        setError("Registration failed. Please try again.");
      }
      // Form values are preserved — React state is not reset on error
    } finally {
      setLoading(false);
    }
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center animate-[fadeIn_0.4s_ease-out]">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: "'Google Sans', sans-serif" }}>Account created!</h2>
          <p className="text-gray-500">Redirecting you to sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left — visual showcase panel */}
      <div className="hidden lg:flex lg:w-[52%] bg-gradient-to-br from-violet-600 via-indigo-600 to-indigo-800 relative overflow-hidden">
        {/* Animated background shapes */}
        <div className="absolute inset-0">
          <div className="absolute top-20 -left-20 w-96 h-96 rounded-full bg-white/5 blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
          <div className="absolute bottom-10 right-0 w-[500px] h-[500px] rounded-full bg-purple-400/10 blur-3xl animate-[pulse_10s_ease-in-out_infinite_2s]" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-indigo-300/10 blur-3xl animate-[pulse_6s_ease-in-out_infinite_4s]" />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }} />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                <path d="M7 14l3-4 2.5 3 3.5-5 4 6H5z" fill="white" fillOpacity="0.8"/>
                <circle cx="8.5" cy="8.5" r="2" fill="white"/>
              </svg>
            </div>
            <span className="text-xl font-semibold text-white tracking-tight">Pixelift</span>
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col justify-center max-w-lg">
            <h1 className="text-[2.75rem] font-bold text-white leading-[1.15] mb-4 tracking-tight" style={{ fontFamily: "'Google Sans', sans-serif" }}>
              Your images,<br />
              <span className="bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
                supercharged.
              </span>
            </h1>
            <p className="text-indigo-200 text-lg leading-relaxed mb-10">
              Upload, compress, and transform your images with professional effects — all in one place.
            </p>

            {/* Feature cards */}
            <div className="space-y-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.07] backdrop-blur-sm border border-white/10 hover:bg-white/[0.1] transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{f.title}</p>
                    <p className="text-indigo-300 text-sm mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Image mosaic */}
          <div className="flex gap-2 mt-8 overflow-hidden">
            {SAMPLE_IMAGES.map((src, i) => (
              <div
                key={i}
                className="w-20 h-14 rounded-lg overflow-hidden shrink-0 opacity-60 hover:opacity-100 transition-opacity border border-white/10"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — registration form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gradient-to-b from-white to-indigo-50/30">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M7 14l3-4 2.5 3 3.5-5 4 6H5z" fill="#a5b4fc"/>
                <circle cx="8.5" cy="8.5" r="2" fill="#e0e7ff"/>
              </svg>
            </div>
            <span className="text-xl font-semibold text-gray-800 tracking-tight">Pixelift</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-[1.7rem] font-bold text-gray-900 tracking-tight" style={{ fontFamily: "'Google Sans', sans-serif" }}>
              Create your account
            </h1>
            <p className="text-gray-500 mt-1.5 text-[15px]">Start transforming images for free</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] text-gray-600 mb-1.5 font-medium">First name</label>
                <input name="firstName" value={form.firstName} onChange={onChange} required placeholder="Jane"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 transition-all placeholder:text-gray-400" />
              </div>
              <div>
                <label className="block text-[13px] text-gray-600 mb-1.5 font-medium">Last name</label>
                <input name="lastName" value={form.lastName} onChange={onChange} required placeholder="Doe"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 transition-all placeholder:text-gray-400" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[13px] text-gray-600 mb-1.5 font-medium">Email</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <input type="email" name="email" value={form.email} onChange={onChange} required placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 transition-all placeholder:text-gray-400" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[13px] text-gray-600 mb-1.5 font-medium">Password</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <input
                  type={showPass ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={onChange}
                  required
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  placeholder="Create a strong password"
                  className="w-full pl-11 pr-11 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 transition-all placeholder:text-gray-400"
                />
                <button type="button" onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 transition-colors">
                  {showPass
                    ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>

              {/* Password strength bar + policy checklist */}
              {form.password.length > 0 && (
                <div className="mt-3 space-y-2.5 animate-[fadeIn_0.2s_ease-out]">
                  {/* Strength bar */}
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

                  {/* Policy checklist */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {POLICY.map((p) => {
                      const passed = p.test(form.password);
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
            <button type="submit" disabled={loading || !allPassed}
              className="w-full py-3 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              style={{
                backgroundColor: allPassed ? "#4f46e5" : "#d1d5db",
                cursor: allPassed ? "pointer" : "not-allowed",
                boxShadow: allPassed ? "0 4px 14px rgba(79,70,229,0.25)" : "none",
              }}>
              {loading && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              )}
              {loading ? "Creating account..." : "Create free account"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">OR</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">
              Sign in
            </Link>
          </p>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-5 mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-gray-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <span className="text-[11px] font-medium">Encrypted</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
              </svg>
              <span className="text-[11px] font-medium">1 GB free</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              <span className="text-[11px] font-medium">CDN fast</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
