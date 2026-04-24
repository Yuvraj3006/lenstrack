"use client";

import Link from "next/link";
import { Shield, Store, Settings } from "lucide-react";
import { LenstrackLogo } from "@/components/lenstrack-logo";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#1A1A2E] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-center pt-12 pb-6">
        <div className="flex flex-col items-center gap-2">
          <LenstrackLogo width={200} />
          <p className="text-white/40 text-xs font-medium tracking-widest uppercase text-center">
            Digital Lens Authentication
          </p>
        </div>
      </header>

      {/* Hero text */}
      <div className="text-center px-4 pb-10">
        <p className="text-white/50 text-sm max-w-xs mx-auto leading-relaxed">
          Genuine lenses, digitally certified. Choose your portal to get started.
        </p>
      </div>

      {/* 3 Portal Cards */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 pb-16 gap-4 max-w-sm mx-auto w-full">

        {/* Customer */}
        <Link href="/verify" className="w-full group">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#E94560] to-[#c73550] p-px">
            <div className="bg-[#1f1f3d] rounded-2xl px-6 py-5 flex items-center gap-4 group-hover:bg-[#252550] transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#E94560]/20 flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6 text-[#E94560]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-base">Verify My Lens</p>
                <p className="text-white/50 text-xs mt-0.5 truncate">
                  Customer portal — enter mobile &amp; OTP
                </p>
              </div>
              <div className="text-white/30 group-hover:text-white/60 transition-colors text-lg">→</div>
            </div>
          </div>
        </Link>

        {/* Store */}
        <Link href="/store/login" className="w-full group">
          <div className="rounded-2xl border border-white/10 px-6 py-5 flex items-center gap-4 bg-white/5 group-hover:bg-white/10 group-hover:border-white/20 transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Store className="h-6 w-6 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-base">Store Login</p>
              <p className="text-white/50 text-xs mt-0.5 truncate">
                Issue &amp; manage lens authentications
              </p>
            </div>
            <div className="text-white/30 group-hover:text-white/60 transition-colors text-lg">→</div>
          </div>
        </Link>

        {/* Admin */}
        <Link href="/admin/login" className="w-full group">
          <div className="rounded-2xl border border-white/10 px-6 py-5 flex items-center gap-4 bg-white/5 group-hover:bg-white/10 group-hover:border-white/20 transition-all">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <Settings className="h-6 w-6 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-base">Admin Panel</p>
              <p className="text-white/50 text-xs mt-0.5 truncate">
                Manage stores, products &amp; reports
              </p>
            </div>
            <div className="text-white/30 group-hover:text-white/60 transition-colors text-lg">→</div>
          </div>
        </Link>

        {/* Divider + tagline */}
        <div className="w-full flex items-center gap-3 mt-2">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/20 text-xs">lenstrack.in</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <p className="text-white/20 text-xs text-center">
          Authenticated. Trusted. Genuine.
        </p>
      </div>
    </div>
  );
}
