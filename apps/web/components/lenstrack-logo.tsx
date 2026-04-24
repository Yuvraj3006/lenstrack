import { cn } from "@/lib/utils";

/** Natural asset size 1024×163 — white wordmark on transparent/black; best on dark UI. */
const LOGO_W = 1024;
const LOGO_H = 163;

type LenstrackLogoProps = {
  className?: string;
  /** Display width in px; height scales to match asset aspect ratio */
  width?: number;
};

export function LenstrackLogo({ className, width = 140 }: LenstrackLogoProps) {
  const height = Math.round((width * LOGO_H) / LOGO_W);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static brand PNG
    <img
      src="/lenstrack-logo.png"
      alt="Lenstrack®"
      width={width}
      height={height}
      className={cn("h-auto max-w-full shrink-0 object-contain object-left", className)}
    />
  );
}
