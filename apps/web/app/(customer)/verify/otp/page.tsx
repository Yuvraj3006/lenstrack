"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function OtpPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [mobile, setMobile] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const m = sessionStorage.getItem("lt_verify_mobile");
    if (!m) { router.push("/verify"); return; }
    setMobile(m);

    // Show dev OTP banner if available
    const d = sessionStorage.getItem("lt_dev_otp");
    if (d) setDevOtp(d);

    // Auto-focus first box
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }, [router]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function verifyOtp(code: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/customer/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, otp: code }),
      });
      const json = (await res.json()) as { success: boolean; error?: string };

      if (!json.success) {
        toast.error(json.error || "Invalid OTP. Please try again.");
        setOtp(["", "", "", "", "", ""]);
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
        return;
      }

      toast.success("Verified! Loading your orders…");
      sessionStorage.removeItem("lt_verify_mobile");
      sessionStorage.removeItem("lt_dev_otp");
      router.push("/account/orders");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (next.every((d) => d !== "")) verifyOtp(next.join(""));
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = digits.split("").concat(Array(6).fill("")).slice(0, 6);
    setOtp(next);
    if (digits.length === 6) verifyOtp(digits);
  }

  async function resendOtp() {
    setResending(true);
    try {
      const res = await fetch("/api/customer/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: { devOtp?: string };
        error?: string;
      };

      if (!json.success) { toast.error(json.error); return; }
      if (json.data?.devOtp) {
        setDevOtp(json.data.devOtp);
        sessionStorage.setItem("lt_dev_otp", json.data.devOtp);
      }

      toast.success("New OTP sent");
      setCountdown(60);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch {
      toast.error("Failed to resend OTP");
    } finally {
      setResending(false);
    }
  }

  const maskedMobile = mobile
    ? `+91 ${mobile.slice(0, 2)}XXXXXX${mobile.slice(-2)}`
    : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1A2E] via-[#16213E] to-[#0F3460] flex flex-col">

      {/* Floating dev OTP popup */}
      {devOtp && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-400 text-amber-900 font-mono font-black text-2xl tracking-[0.25em] px-6 py-3 rounded-2xl shadow-2xl select-all">
          {devOtp}
        </div>
      )}

      {/* Header */}
      <header className="p-5 flex items-center justify-between">
        <Link
          href="/verify"
          className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-[#E94560]" />
          <span className="text-base font-bold text-white">
            Lens<span className="text-[#E94560]">track</span>
          </span>
        </div>
        <div className="w-16" />
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Headline */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">📱</div>
            <h1 className="text-2xl font-bold text-white">Enter OTP</h1>
            <p className="text-white/50 mt-2 text-sm">
              6-digit code sent to{" "}
              <span className="font-semibold text-white">{maskedMobile}</span>
            </p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl p-7 shadow-2xl">

            {/* 6-box input */}
            <div
              className="flex justify-center gap-2.5 mb-6"
              onPaste={handlePaste}
            >
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  disabled={loading}
                  className={`w-11 h-13 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-all
                    ${digit ? "border-[#E94560] bg-red-50 text-[#E94560]" : "border-gray-200 text-gray-800"}
                    focus:border-[#E94560] focus:bg-red-50
                    disabled:opacity-40`}
                  style={{ height: "52px" }}
                />
              ))}
            </div>

            {/* Loading state */}
            {loading && (
              <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying…
              </div>
            )}

            {/* Resend */}
            <div className="text-center">
              {countdown > 0 ? (
                <p className="text-sm text-gray-400">
                  Resend OTP in{" "}
                  <span className="font-semibold text-[#1A1A2E]">
                    0:{String(countdown).padStart(2, "0")}
                  </span>
                </p>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resendOtp}
                  disabled={resending}
                  className="text-[#E94560] hover:text-[#c73550] hover:bg-red-50 font-semibold"
                >
                  {resending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      Sending…
                    </>
                  ) : (
                    "Resend OTP"
                  )}
                </Button>
              )}
            </div>
          </div>

          <p className="text-center text-white/20 text-xs mt-5">
            OTP is valid for 5 minutes
          </p>
        </div>
      </div>
    </div>
  );
}
