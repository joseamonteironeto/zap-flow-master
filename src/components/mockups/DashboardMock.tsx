import { motion } from "motion/react";
import {
  Bot,
  Gauge,
  Layers,
  MessageSquare,
  Settings,
  Shield,
  ShieldBan,
  Smile,
  Users,
} from "lucide-react";
import { Bars, Sparkline } from "@/components/mockups/Panel";
import { cn } from "@/lib/utils";

const SIDEBAR = [
  { label: "Visão Geral", icon: Gauge, active: true },
  { label: "Grupos", icon: Users },
  { label: "Automação", icon: Bot },
  { label: "Reações", icon: Smile },
  { label: "Fiscal", icon: Shield },
  { label: "Blacklist", icon: ShieldBan },
  { label: "Respostas", icon: MessageSquare },
  { label: "CRM", icon: Layers },
  { label: "Configurações", icon: Settings },
];

const METRICS = [
  { label: "Grupos monitorados", value: "127", delta: "+12%" },
  { label: "Interações hoje", value: "48.392", delta: "+8,4%" },
  { label: "Respostas automáticas", value: "1.842", delta: "+21%" },
  { label: "Bloqueios realizados", value: "27", delta: "-3%" },
];

const ACTIVITY = [
  "10:42 — Resposta automática enviada",
  "10:41 — Novo contato adicionado ao CRM",
  "10:40 — URL bloqueada em Comunidade Principal",
  "10:38 — Reação automática aplicada",
];

const FLOATING = [
  { text: "Nova automação executada", top: "6%", side: "left" },
  { text: "Mensagem respondida automaticamente", top: "34%", side: "right" },
  { text: "Usuário adicionado à blacklist", top: "68%", side: "left" },
  { text: "Grupo monitorado", top: "86%", side: "right" },
] as const;

export function DashboardMock() {
  return (
    <div className="relative">
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="overflow-hidden rounded-2xl border border-border panel-gradient shadow-[var(--shadow-panel)]"
      >
        <div className="flex items-center gap-3 border-b border-border bg-surface/70 px-4 py-3">
          <span className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-muted-foreground/30" />
            <span className="size-2.5 rounded-full bg-muted-foreground/30" />
            <span className="size-2.5 rounded-full bg-primary/60" />
          </span>
          <span className="truncate text-xs text-muted-foreground">
            app.tudozap.com / visão geral
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[190px_minmax(0,1fr)]">
          <aside className="hidden border-r border-border bg-sidebar/60 p-3 md:block">
            {SIDEBAR.map((item) => (
              <div
                key={item.label}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px]",
                  item.active
                    ? "bg-primary/12 text-primary ring-1 ring-primary/25"
                    : "text-muted-foreground",
                )}
              >
                <item.icon className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>
            ))}
          </aside>

          <div className="min-w-0 space-y-4 p-4 sm:p-5">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {METRICS.map((m) => (
                <div key={m.label} className="rounded-xl border border-border bg-surface/70 p-3">
                  <p className="truncate text-[11px] text-muted-foreground">{m.label}</p>
                  <p className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{m.value}</p>
                  <p className="mt-1 text-[11px] text-primary">{m.delta} vs. ontem</p>
                </div>
              ))}
            </div>

            <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
              <div className="rounded-xl border border-border bg-surface/70 p-4">
                <p className="text-xs text-muted-foreground">Interações — últimos 7 dias</p>
                <Sparkline data={[12, 26, 18, 34, 29, 44, 52]} />
              </div>
              <div className="rounded-xl border border-border bg-surface/70 p-4">
                <p className="text-xs text-muted-foreground">Automações executadas</p>
                <Bars data={[14, 22, 18, 30, 26, 38, 44]} className="mt-3 h-16" />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface/70 p-4">
              <p className="text-xs text-muted-foreground">Atividade recente</p>
              <ul className="mt-3 space-y-2.5">
                {ACTIVITY.map((a) => (
                  <li key={a} className="flex items-center gap-2.5 text-[12px] text-foreground/80">
                    <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                    <span className="truncate">{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="pointer-events-none absolute inset-0 hidden 2xl:block">
        {FLOATING.map((n, i) => (
          <motion.div
            key={n.text}
            initial={{ opacity: 0, x: n.side === "left" ? -20 : 20 }}
            animate={{ opacity: 1, x: 0, y: [0, -6, 0] }}
            transition={{
              opacity: { delay: 0.4 + i * 0.25, duration: 0.5 },
              x: { delay: 0.4 + i * 0.25, duration: 0.5 },
              y: { duration: 6 + i, repeat: Infinity, ease: "easeInOut" },
            }}
            className={cn(
              "absolute flex max-w-[230px] items-center gap-2 rounded-xl border border-border glass-card px-3 py-2 text-[12px] text-foreground/90",
              n.side === "left" ? "right-full mr-5" : "left-full ml-5",
            )}
            style={{ top: n.top }}
          >
            <span className="size-1.5 shrink-0 rounded-full bg-primary" />
            <span className="truncate">{n.text}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
