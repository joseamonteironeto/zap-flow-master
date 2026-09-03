import { cn } from "@/lib/utils";

const logoUrl = "/brand/tudozap-logo-header.png";

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-9 shrink-0 items-center text-[22px] font-bold leading-none tracking-tight",
        className,
      )}
      aria-label="TudoZap"
    >
      <span className="flex h-full w-[9rem] items-center dark:hidden">
        <img src={logoUrl} alt="TudoZap" className="block h-auto w-full object-contain" />
      </span>
      <span className="hidden items-center dark:inline-flex">
        <span className="text-foreground">Tudo</span><span className="text-primary">Zap</span>
      </span>
    </span>
  );
}
