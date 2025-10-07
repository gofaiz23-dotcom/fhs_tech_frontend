"use client";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "../lib/auth/context";
import { AuthApiError, testApiConnectivity } from "../lib/auth/api";
import { validatePassword, getPasswordStrengthColor, getPasswordStrengthText } from "../lib/utils/passwordValidation";

export default function LoginPage() {
  // Authentication context and router
  const { login, state, clearError } = useAuth();
  const router = useRouter();

  // Form state
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // Password validation state
  const [passwordValidation, setPasswordValidation] = React.useState(validatePassword(""));
  const [showPasswordValidation, setShowPasswordValidation] = React.useState(false);
  
  // Debug state
  const [debugInfo, setDebugInfo] = React.useState<string>("");

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

  // Validate password on change
  React.useEffect(() => {
    const validation = validatePassword(password);
    setPasswordValidation(validation);
  }, [password]);

  /**
   * Test API connectivity for debugging
   */
  const testConnectivity = async () => {
    try {
      setDebugInfo("Testing connectivity...");
      const result = await testApiConnectivity();
      setDebugInfo(JSON.stringify(result, null, 2));
    } catch (error) {
      setDebugInfo(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

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
                  onFocus={() => setShowPasswordValidation(true)}
                  onBlur={() => setShowPasswordValidation(false)}
                  className={`mt-1 w-full border bg-white/10 text-white placeholder-white/60 rounded px-3 py-2 pr-10 text-sm focus:outline-none transition-colors ${
                    passwordValidation.isValid ? 'border-green-400 focus:border-green-400' : 'border-red-400 focus:border-red-400'
                  }`}
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
              
              {/* Password validation feedback */}
              {showPasswordValidation && password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/70">Password strength:</span>
                    <span className={`text-xs font-medium ${getPasswordStrengthColor(passwordValidation.strength)}`}>
                      {getPasswordStrengthText(passwordValidation.strength)}
                    </span>
                  </div>
                  {passwordValidation.errors.length > 0 && (
                    <div className="space-y-1">
                      {passwordValidation.errors.map((error, index) => (
                        <div key={index} className="text-xs text-red-300 flex items-center gap-1">
                          <span className="text-red-400">•</span>
                          {error}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
              className="w-full btn-primary py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || !email.trim() || !password.trim() || !passwordValidation.isValid}
            >
              {isSubmitting && <div className="loader w-4 h-4"></div>}
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
          
          {/* Debug Section - Remove in production */}
          <div className="mt-4 pt-4 border-t border-white/20">
            <button 
              type="button"
              onClick={testConnectivity}
              className="text-xs text-white/60 hover:text-white/80 underline"
            >
              Test API Connectivity
            </button>
            {debugInfo && (
              <pre className="mt-2 text-xs text-white/60 bg-black/20 p-2 rounded overflow-auto max-h-32">
                {debugInfo}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


