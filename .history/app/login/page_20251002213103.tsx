"use client";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "../lib/auth/context";
import { AuthApiError } from "../lib/auth/api";

export default function LoginPage() {
  // Authentication context and router
  const { login, state, clearError } = useAuth();
  const router = useRouter();

  // Form state
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (state.isAuthenticated && !state.isLoading) {
      router.push('/dashboard');
    }
  }, [state.isAuthenticated, state.isLoading, router]);

  // Clear errors when component mounts or form values change
  React.useEffect(() => {
    if (state.error) {
      clearError();
    }
  }, [email, password, clearError]);

  /**
   * Handle form submission
   * 
   * Validates input and attempts to authenticate user
   * Redirects to dashboard on success
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    // Clear any existing errors
    clearError();
    
    // Basic validation
    if (!email.trim() || !password.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Attempt login
      await login(email.trim(), password);
      
      // Redirect will happen via useEffect when state updates
      // router.push('/dashboard');
    } catch (error) {
      // Error is handled by the auth context
      console.error('Login failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover mute  z-0"
      >
        <source src="/login-bg.mp4" type="video/mp4" />
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
          
          {/* Error Message */}
          {state.error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-lg flex items-center gap-2">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <span className="text-red-200 text-sm">{state.error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-white/80">Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="mt-1 w-full border border-white/20 bg-white/10 text-white placeholder-white/60 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 transition-colors" 
                placeholder="you@company.com" 
                required 
                disabled={isSubmitting}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="text-xs text-white/80">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="mt-1 w-full border border-white/20 bg-white/10 text-white placeholder-white/60 rounded px-3 py-2 pr-10 text-sm focus:outline-none focus:border-blue-400 transition-colors" 
                  placeholder="••••••••" 
                  required 
                  disabled={isSubmitting}
                  autoComplete="current-password"
                />
                <button 
                  type="button" 
                  aria-label="toggle password visibility" 
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors disabled:opacity-50" 
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
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
            <button 
              type="submit" 
              className="w-full bg-blue-600/90 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white py-2 rounded text-sm transition-colors flex items-center justify-center gap-2"
              disabled={isSubmitting || !email.trim() || !password.trim()}
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? 'Logging in...' : 'Log In'}
            </button>
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


