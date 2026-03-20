import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api/auth";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form.email, form.password, form.firstName, form.lastName);
      navigate("/login");
    } catch {
      setError("Registration failed. Email may already be in use.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left — branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-700 via-indigo-700 to-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-32 -left-10 w-80 h-80 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-10 right-20 w-72 h-72 rounded-full bg-indigo-300/20 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white max-w-xl">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="20" height="20" rx="4" fill="white" fillOpacity="0.2"/>
              <path d="M7 14l3-4 2.5 3 3.5-5 4 6H5z" fill="white" fillOpacity="0.6"/>
              <circle cx="8.5" cy="8.5" r="2" fill="white" fillOpacity="0.8"/>
            </svg>
            <span className="text-2xl font-semibold tracking-tight">Pixelift</span>
          </div>

          <h1 className="text-4xl font-bold leading-tight mb-6">
            Your images,<br />elevated
          </h1>
          <p className="text-lg text-indigo-100 leading-relaxed mb-10">
            Join Pixelift and get access to automatic compression, five image effects, batch uploads, and 1 GB of CDN-backed cloud storage — completely free.
          </p>

          {/* How it works */}
          <div className="space-y-5">
            {[
              { step: "1", title: "Upload", desc: "Drag & drop up to 30 images at once" },
              { step: "2", title: "Auto-compress", desc: "Images are optimized in the background" },
              { step: "3", title: "Transform", desc: "Apply grayscale, sepia, blur, sharpen, or invert" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-sm font-bold shrink-0 border border-white/20">
                  {item.step}
                </div>
                <div>
                  <p className="font-semibold text-sm">{item.title}</p>
                  <p className="text-sm text-indigo-200">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — registration form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="text-center mb-8 lg:mb-10">
            <div className="lg:hidden inline-flex items-center gap-2 mb-6">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="2" width="20" height="20" rx="4" fill="#6366f1"/>
                <path d="M7 14l3-4 2.5 3 3.5-5 4 6H5z" fill="#a5b4fc"/>
                <circle cx="8.5" cy="8.5" r="2" fill="#e0e7ff"/>
              </svg>
              <span className="text-xl font-semibold text-gray-800 tracking-tight">Pixelift</span>
            </div>
            <h1 className="text-2xl font-semibold text-gray-800" style={{ fontFamily: "'Google Sans', sans-serif" }}>
              Create your account
            </h1>
            <p className="text-sm text-gray-500 mt-1.5">Start transforming images for free</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1.5 font-medium">First name</label>
                <input name="firstName" value={form.firstName} onChange={onChange} required placeholder="Jane"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-gray-400" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1.5 font-medium">Last name</label>
                <input name="lastName" value={form.lastName} onChange={onChange} required placeholder="Doe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1.5 font-medium">Email</label>
              <input type="email" name="email" value={form.email} onChange={onChange} required placeholder="you@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-gray-400" />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1.5 font-medium">Password</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} name="password" value={form.password} onChange={onChange} required placeholder="Min. 6 characters"
                  className="w-full px-4 py-3 pr-11 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-gray-400" />
                <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                  {showPass
                    ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-indigo-200">
              {loading && <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
              {loading ? "Creating account..." : "Create free account"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-800 font-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
