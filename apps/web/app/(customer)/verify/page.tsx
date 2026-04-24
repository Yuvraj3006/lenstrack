"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, Loader2, Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  mobile: z
    .string()
    .length(10, "Enter a valid 10-digit mobile number")
    .regex(/^[6-9]\d{9}$/, "Enter a valid Indian mobile number"),
});
type Form = z.infer<typeof schema>;

export default function VerifyPage() {
  const router = useRouter();
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  async function onSubmit(data: Form) {
    try {
      const res = await fetch("/api/customer/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: data.mobile }),
      });

      const json = (await res.json()) as {
        success: boolean;
        data?: { devOtp?: string; expiresIn?: number };
        error?: string;
      };

      if (!json.success) {
        toast.error(json.error || "Failed to send OTP");
        return;
      }

      // In dev mode the OTP is returned in the response — save it for the OTP page
      if (json.data?.devOtp) {
        setDevOtp(json.data.devOtp);
        sessionStorage.setItem("lt_dev_otp", json.data.devOtp);
      }

      sessionStorage.setItem("lt_verify_mobile", data.mobile);
      toast.success("OTP sent to your mobile");
      router.push("/verify/otp");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1A2E] via-[#16213E] to-[#0F3460] flex flex-col">
      {/* Header */}
      <header className="p-5 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Home
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
          {/* Icon + headline */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-5">
              <Shield className="h-8 w-8 text-[#E94560]" />
            </div>
            <h1 className="text-2xl font-bold text-white leading-tight">
              Verify your lens
            </h1>
            <p className="text-white/50 mt-2 text-sm leading-relaxed">
              Enter your mobile number to view your digitally authenticated Lenstrack lenses
            </p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl p-6 shadow-2xl space-y-5">
            {/* Dev OTP banner */}
            {devOtp && (
              <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs text-amber-700 font-medium">🔧 OTP (local / debug)</p>
                <span className="font-mono font-bold text-xl text-amber-800 tracking-widest">
                  {devOtp}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[#1A1A2E] font-semibold text-sm">
                  Mobile Number
                </Label>
                <div className="flex items-center border-2 rounded-xl overflow-hidden focus-within:border-[#E94560] transition-colors">
                  <span className="px-3 py-3 bg-gray-50 text-gray-500 text-sm font-medium border-r border-gray-200 select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="98765 43210"
                    autoComplete="tel-national"
                    autoFocus
                    className="flex-1 px-3 py-3 text-base bg-white outline-none placeholder:text-gray-300 tracking-wide"
                    {...register("mobile")}
                  />
                </div>
                {errors.mobile && (
                  <p className="text-xs text-red-500 pt-0.5">
                    {errors.mobile.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 text-base font-semibold bg-[#E94560] hover:bg-[#c73550] rounded-xl"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Sending OTP…
                  </>
                ) : (
                  "Send OTP"
                )}
              </Button>
            </form>

            <p className="text-center text-xs text-gray-400">
              A 6-digit OTP will be sent to your mobile number
            </p>
          </div>

          <p className="text-center text-white/20 text-xs mt-5">
            By continuing you agree to Lenstrack&apos;s terms of service
          </p>
        </div>
      </div>
    </div>
  );
}
