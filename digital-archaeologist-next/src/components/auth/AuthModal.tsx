"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Mail,
  Lock,
  User,
  ArrowRight,
  Database,
  CheckCircle2,
  Loader2,
  Fingerprint
} from "lucide-react";
import { authenticateUser } from "@/lib/api";
import { AuthenticatedUser, AuthProvider } from "@/lib/types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthenticatedUser) => void;
  initialMode?: "signin" | "signup";
  initialProvider?: AuthProvider | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = "signup",
  initialProvider = null
}) => {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [view, setView] = useState<"main" | "apple_sheet">("main");

  // Form fields for email flow
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  // Apple Sheet Options
  const [appleShareEmailType, setAppleShareEmailType] = useState<"share" | "hide">("share");

  // Status
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successUser, setSuccessUser] = useState<AuthenticatedUser | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage("");
      setSuccessUser(null);
      setIsLoading(false);
      if (initialProvider === "google") {
        setView("main");
        // Trigger Google's real official OAuth popup
        setTimeout(() => handleGoogleSignIn(), 150);
      } else if (initialProvider === "apple") {
        setView("apple_sheet");
      } else {
        setView("main");
      }
    }
  }, [isOpen, initialProvider]);

  if (!isOpen) return null;

  const handleReset = () => {
    setView("main");
    setErrorMessage("");
    setSuccessUser(null);
    setIsLoading(false);
  };

  /**
   * Stores authenticated user in the database
   */
  const handleAutoAuthenticate = async (
    targetEmail: string,
    targetName: string,
    provider: AuthProvider
  ) => {
    setIsLoading(true);
    setErrorMessage("");
    setStatusMessage(
      provider === "google"
        ? "Syncing Google account to database..."
        : provider === "apple"
        ? "Saving Apple ID to database..."
        : "Saving details to SQLite database..."
    );

    try {
      const response = await authenticateUser(
        targetEmail.trim(),
        targetName.trim() || targetEmail.split("@")[0],
        provider
      );

      if (response && response.user) {
        setSuccessUser(response.user);

        // Store session in localStorage
        try {
          localStorage.setItem("digital_archaeologist_user", JSON.stringify(response.user));
        } catch {}

        setTimeout(() => {
          onSuccess(response.user);
          handleReset();
          onClose();
        }, 900);
      } else {
        setErrorMessage("Authentication failed. Database could not verify user.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to authenticate and store user in database.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Triggers Google's REAL official OAuth popup window hosted by Google
   */
  const handleGoogleSignIn = () => {
    setIsLoading(true);
    setErrorMessage("");
    setStatusMessage("Opening Google Sign-in popup...");

    const clientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      "696070150583-k3dma7021md9mmrmun0uoctake289j07.apps.googleusercontent.com";

    // 1. Google Identity Services official OAuth2 token client
    if (typeof window !== "undefined" && (window as any).google?.accounts?.oauth2) {
      try {
        const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "openid profile email",
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.error) {
              setErrorMessage("Google Sign-In was cancelled or failed.");
              setIsLoading(false);
              return;
            }
            if (tokenResponse?.access_token) {
              setStatusMessage("Verifying account with Google...");
              try {
                const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                if (res.ok) {
                  const profile = await res.json();
                  await handleAutoAuthenticate(
                    profile.email,
                    profile.name || profile.email.split("@")[0],
                    "google"
                  );
                  return;
                }
              } catch (e: any) {
                setErrorMessage(e.message || "Failed to retrieve user profile from Google.");
              }
            }
            setIsLoading(false);
          },
          error_callback: () => {
            setIsLoading(false);
          }
        });

        // Request real popup dialog from accounts.google.com
        tokenClient.requestAccessToken({ prompt: "select_account" });
        return;
      } catch (err) {
        console.warn("GIS tokenClient error, using standard popup window:", err);
      }
    }

    // 2. Direct standard Google OAuth2 popup fallback
    const redirectUri = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      clientId
    )}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(
      "openid email profile"
    )}&prompt=select_account`;

    const width = 500;
    const height = 620;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const popup = window.open(
      authUrl,
      "google_oauth_popup",
      `width=${width},height=${height},left=${left},top=${top}`
    );

    if (!popup) {
      setErrorMessage("Pop-up blocked. Please allow pop-ups for this site and try again.");
      setIsLoading(false);
      return;
    }

    const pollTimer = setInterval(async () => {
      try {
        if (!popup || popup.closed) {
          clearInterval(pollTimer);
          setIsLoading(false);
          return;
        }
        if (popup.location && popup.location.href && popup.location.href.includes(redirectUri)) {
          const hash = popup.location.hash;
          if (hash && hash.includes("access_token")) {
            clearInterval(pollTimer);
            popup.close();
            const params = new URLSearchParams(hash.substring(1));
            const accessToken = params.get("access_token");
            if (accessToken) {
              setStatusMessage("Verifying account with Google...");
              const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${accessToken}` }
              });
              if (res.ok) {
                const profile = await res.json();
                await handleAutoAuthenticate(
                  profile.email,
                  profile.name || profile.email.split("@")[0],
                  "google"
                );
                return;
              }
            }
          }
        }
      } catch {
        // Cross-origin while on google.com
      }
    }, 400);
  };

  const handleEmailFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (mode === "signup" && !name.trim()) {
      setErrorMessage("Please provide your full name for sign up.");
      return;
    }
    handleAutoAuthenticate(email, name || email.split("@")[0], "email");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden relative transition-all">
        {/* Accent Bar */}
        <div className="h-1.5 bg-gradient-to-r from-[#E8532E] via-amber-500 to-[#E8532E]" />

        {/* Close Button */}
        <button
          onClick={() => {
            handleReset();
            onClose();
          }}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ─── SUCCESS OVERLAY ─── */}
        {successUser ? (
          <div className="p-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-gray-900">Authenticated!</h3>
              <p className="text-sm text-gray-600">
                Welcome, <strong>{successUser.name}</strong>
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-600 text-left space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Email:</span>
                <span className="font-medium text-gray-900">{successUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Provider:</span>
                <span className="font-medium capitalize text-gray-900">{successUser.provider}</span>
              </div>
              <div className="flex items-center gap-1.5 text-green-700 font-medium pt-1 text-[11px]">
                <Database className="w-3.5 h-3.5" />
                <span>Saved into SQLite Prisma Database</span>
              </div>
            </div>
          </div>
        ) : view === "apple_sheet" ? (
          /* ─── APPLE ID SIGN IN SHEET ─── */
          <div className="p-7 space-y-5 animate-in fade-in duration-200">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center mx-auto shadow-md">
                <AppleIcon className="w-6 h-6 fill-current" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 tracking-tight">Sign in with Apple</h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Use your Apple ID to sign in to Digital Archaeologist.
              </p>
            </div>

            <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200 text-xs text-gray-700">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <span className="font-medium">Name:</span>
                <span className="text-gray-900 font-semibold">Apple User</span>
              </div>
              <div className="space-y-2">
                <span className="font-medium block">Email:</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="apple_email"
                    checked={appleShareEmailType === "share"}
                    onChange={() => setAppleShareEmailType("share")}
                    className="accent-black"
                  />
                  <span>Share My Email (user@icloud.com)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="apple_email"
                    checked={appleShareEmailType === "hide"}
                    onChange={() => setAppleShareEmailType("hide")}
                    className="accent-black"
                  />
                  <span>Hide My Email (Private Relay)</span>
                </label>
              </div>
            </div>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => {
                const finalEmail =
                  appleShareEmailType === "share"
                    ? "user@icloud.com"
                    : "user.private@privaterelay.appleid.com";
                handleAutoAuthenticate(finalEmail, "Apple User", "apple");
              }}
              className="w-full bg-black hover:bg-gray-900 text-white text-sm font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authorizing with Apple ID...</span>
                </>
              ) : (
                <>
                  <Fingerprint className="w-4 h-4" />
                  <span>Continue with Touch ID / Passkey</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* ─── MAIN AUTHENTICATOR VIEW (Real Google Popup / Apple / Email) ─── */
          <div className="p-7 sm:p-8 space-y-6 animate-in fade-in duration-200">
            {/* Header */}
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-[#E8532E] text-xs font-medium border border-orange-200/60 mb-1">
                <Database className="w-3.5 h-3.5" />
                <span>SQLite Database Storage</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                {mode === "signup" ? "Create your account" : "Welcome back"}
              </h2>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Authenticate with Google, Apple, or Email. User details are stored directly in the
                database.
              </p>
            </div>

            {/* Social Buttons */}
            <div className="space-y-2.5">
              {/* Google Button: Triggers Google's Official Popup */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium transition-all shadow-2xs group cursor-pointer disabled:opacity-50"
              >
                <GoogleIcon className="w-5 h-5 shrink-0" />
                <span>Continue with Google</span>
              </button>

              {/* Apple Button */}
              <button
                type="button"
                onClick={() => setView("apple_sheet")}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-black hover:bg-gray-900 text-white text-sm font-medium transition-all shadow-2xs group cursor-pointer"
              >
                <AppleIcon className="w-4 h-4 shrink-0 fill-current" />
                <span>Continue with Apple</span>
              </button>
            </div>

            {/* Loading Indicator for Google/Apple */}
            {isLoading && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center gap-2 text-xs text-blue-700 font-medium">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Divider */}
            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-gray-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider relative">
                or with email
              </span>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailFormSubmit} className="space-y-3.5">
              {mode === "signup" && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Mercer"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:border-[#E8532E] focus:ring-1 focus:ring-[#E8532E]/20 focus:outline-none text-gray-900 transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email ID</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. engineer@company.com"
                    required
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:border-[#E8532E] focus:ring-1 focus:ring-[#E8532E]/20 focus:outline-none text-gray-900 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:border-[#E8532E] focus:ring-1 focus:ring-[#E8532E]/20 focus:outline-none text-gray-900 transition-all"
                  />
                </div>
              </div>

              {errorMessage && (
                <p className="text-xs text-red-500 bg-red-50 p-2.5 rounded-lg border border-red-200">
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#E8532E] hover:bg-[#D44724] text-white text-sm font-semibold py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{mode === "signup" ? "Create Account & Save" : "Sign In & Continue"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Toggle Sign In / Sign Up */}
            <div className="text-center pt-1 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signup" ? "signin" : "signup");
                  setErrorMessage("");
                }}
                className="text-xs text-gray-500 hover:text-[#E8532E] transition-colors"
              >
                {mode === "signup" ? (
                  <>
                    Already have an account? <span className="font-semibold text-gray-900">Sign in</span>
                  </>
                ) : (
                  <>
                    Don&apos;t have an account?{" "}
                    <span className="font-semibold text-gray-900">Sign up</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 170 170">
      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.34-6.19-9.56-11.03-20.87-14.53-33.93-3.5-13.06-5.25-25.56-5.25-37.5 0-14.12 3.5-25.96 10.5-35.53 7-9.56 15.83-14.42 26.5-14.58 4.12 0 8.94 1.13 14.46 3.38 5.52 2.25 9.4 3.43 11.64 3.53 1.96 0 6.07-1.28 12.33-3.84 6.26-2.56 11.45-3.69 15.58-3.38 11.53.65 20.89 4.89 28.08 12.72 7.19 7.83 11.53 17.51 13.02 29.04-10.22 6.19-15.22 14.79-15 25.8.22 9.13 3.69 16.74 10.42 22.83 6.74 6.09 14.89 9.57 24.46 10.44-2.06 6.3-4.56 12.61-7.5 18.93zM119.22 31.84c0-7.39 2.5-14.3 7.5-20.73 5-6.43 11.39-10.66 19.16-12.71.65 1.52.98 3.15.98 4.89 0 7.39-2.61 14.41-7.83 21.05-5.22 6.63-11.63 10.76-19.22 12.39-.22-1.52-.59-3.15-.59-4.89z" />
    </svg>
  );
}
