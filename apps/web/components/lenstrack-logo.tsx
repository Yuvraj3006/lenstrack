import { cn } from "@/lib/utils";

type LenstrackLogoProps = {
  className?: string;
  /** Display width in px; height scales with SVG aspect ratio */
  width?: number;
};

export function LenstrackLogo({ className, width = 140 }: LenstrackLogoProps) {
  const height = Math.round((width * 44) / 240);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- local SVG wordmark
    <img
      src="/lenstrack-logo.svg"
      alt="Lenstrack"
      width={width}
      height={height}
      className={cn("h-auto max-w-full shrink-0", className)}
    />
  );
}
