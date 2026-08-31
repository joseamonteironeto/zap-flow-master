import logoAsset from "@/assets/tudozap-logo.png.asset.json";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("relative grid size-9 shrink-0 place-items-center", className)}>
      <img
        src={logoAsset.url}
        alt="TudoZap"
        className="size-full object-contain object-left"
        style={{ objectPosition: "left center", clipPath: "inset(0 71% 0 0)" }}
      />
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <img
      src={logoAsset.url}
      alt="TudoZap"
      className={cn("h-9 w-auto max-w-[170px] shrink-0 object-contain", className)}
    />
  );
}
