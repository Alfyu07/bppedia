import Link from "next/link";
import { cn } from "@/lib/utils";

interface WordmarkProps {
  className?: string;
  href?: string;
  suffix?: string;
}

export function Wordmark({ className, href = "/", suffix }: WordmarkProps) {
  return (
    <Link
      className={cn(
        "inline-flex items-baseline gap-1.5 font-semibold text-brand tracking-[-0.04em]",
        className
      )}
      href={href}
    >
      <span>BPPedia</span>
      {suffix ? (
        <span className="text-muted-foreground text-xs tracking-normal">
          {suffix}
        </span>
      ) : null}
    </Link>
  );
}
