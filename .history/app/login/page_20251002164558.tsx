"use client";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrate authentication API here
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover mute loop z-0"
      >
        <source src="/login_bg_vid.mp4" type="video/mp4" />
        {/* Fallback for browsers that don't support video */}
        Your browser does not support the video tag.
      </video>
      <div className="absolute inset-0 bg-black/40 z-10" />
      <div className="relative w-full max-w-md mx-auto p-6 z-20">
        <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Image src="/fhs-tech-logo.png" alt="FHS Tech" width={120} height={120} />
          </div>
            <div className="text-xl font-semibold text-white">Welcome Back</div>
          <div className="text-sm text-white/80 mb-6">Enter your email and password to access your account.</div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-white/80">Email</label>
              <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="mt-1 w-full border border-white/20 bg-white/10 text-white placeholder-white/60 rounded px-3 py-2 text-sm focus:outline-none" placeholder="you@company.com" required />
            </div>
            <div>
              <label className="text-xs text-white/80">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e)=>setPassword(e.target.value)} className="mt-1 w-full border border-white/20 bg-white/10 text-white placeholder-white/60 rounded px-3 py-2 pr-10 text-sm focus:outline-none" placeholder="••••••••" required />
                <button type="button" aria-label="toggle password" className="absolute right-2 top-1/2 -translate-y-1/2 text-white/80" onClick={()=>setShowPassword(!showPassword)}>
                  {showPassword ?   <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>
            {/* <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-white/80">
                <input type="checkbox" className="h-4 w-4" checked={remember} onChange={(e)=>setRemember(e.target.checked)} />
                <span>Remember Me</span>
              </label>
              <Link href="#" className="text-blue-200 hover:underline">Forgot Your Password?</Link>
            </div> */}
            <button type="submit" className="w-full bg-blue-600/90 hover:bg-blue-700 text-white py-2 rounded text-sm">Log In</button>
          </form>
          {/* <div className="flex items-center my-4">
            <div className="flex-1 h-px bg-white/20"></div>
            <div className="px-3 text-xs text-white/70">Or Login With</div>
            <div className="flex-1 h-px bg-white/20"></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button className="border border-white/30 bg-white/10 text-white rounded py-2 text-sm">Google</button>
            <button className="border border-white/30 bg-white/10 text-white rounded py-2 text-sm">Apple</button>
          </div> */}
          {/* <div className="text-xs text-white/80 mt-6">
            Don&apos;t Have An Account? <Link href="#" className="text-blue-200 hover:underline">Register Now.</Link>
          </div> */}
          <div className="text-[10px] text-white/60 mt-6">Privacy Policy</div>
        </div>
      </div>
    </div>
  );
}


