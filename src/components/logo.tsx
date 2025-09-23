import { cn } from "@/lib/utils";

interface LogoProps extends React.SVGProps<SVGSVGElement> {}

export function Logo({ className, ...props }: LogoProps) {
  return (
    <svg
      width="600"
      height="120"
      viewBox="0 0 600 120"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Active Audition"
      className={cn(className)}
      {...props}
    >
      <defs>
        <linearGradient
          id="aaGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#2196F3" />
          <stop offset="100%" stopColor="#FF4081" />
        </linearGradient>
      </defs>
      <text
        x="0"
        y="85"
        fill="url(#aaGradient)"
        fontFamily="Roboto, Arial, sans-serif"
        fontWeight="700"
        fontSize="72"
        letterSpacing="0.5"
      >
        Active Audition
      </text>
    </svg>
  );
}
