import { cn } from "@/lib/utils";

interface LogoProps extends React.SVGProps<SVGSVGElement> {}

export function Logo({ className, ...props }: LogoProps) {
  return (
    <svg
      width="150"
      height="30"
      viewBox="0 0 600 120"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Active Audition"
      className={cn("text-primary", className)}
      {...props}
    >
      <defs>
        <linearGradient
          id="aaGradient"
          gradientUnits="objectBoundingBox"
          gradientTransform="rotate(45)"
        >
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--accent))" />
        </linearGradient>
      </defs>
      <text
        x="0"
        y="85"
        fill="url(#aaGradient)"
        fontFamily='"PT Sans", Arial, sans-serif'
        fontWeight="700"
        fontSize="72"
        letterSpacing="0.5"
      >
        Active Audition
      </text>
    </svg>
  );
}
