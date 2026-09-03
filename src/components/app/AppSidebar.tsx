import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  CalendarClock,
  ChevronDown,
  Contact,
  Gauge,
  Layers,
  LogOut,
  MessageSquare,
  Plug,
  Settings,
  Shield,
  ShieldBan,
  ShoppingCart,
  Smartphone,
  Smile,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { PANEL_USER } from "@/lib/panel-data";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  icon: typeof Gauge;
  to?: string;
  children?: { label: string; to: string }[];
};

export const NAV: NavItem[] = [
  { label: "Visão Geral", icon: Gauge, to: "/app" },
  { label: "Instâncias", icon: Smartphone, to: "/app/instancias" },
  { label: "Grupos", icon: Users, to: "/app/grupos" },
  { label: "Reações", icon: Smile, to: "/app/reacoes" },
  { label: "Mensagens", icon: MessageSquare, to: "/app/mensagens" },
  { label: "Agendamentos", icon: CalendarClock, to: "/app/agendamentos" },
  { label: "Fiscal", icon: Shield, to: "/app/fiscal" },
  {
    label: "Blacklist",
    icon: ShieldBan,
    children: [
      { label: "Usuários", to: "/app/blacklist/usuarios" },
      { label: "Palavras", to: "/app/blacklist/palavras" },
      { label: "URLs", to: "/app/blacklist/urls" },
    ],
  },
  { label: "Respostas Automáticas", icon: MessageSquare, to: "/app/respostas" },
  { label: "Contatos", icon: Contact, to: "/app/contatos" },
  { label: "CRM", icon: Layers, to: "/app/crm" },
  { label: "Relatórios", icon: BarChart3, to: "/app/relatorios" },
  { label: "Integrações", icon: Plug, to: "/app/integracoes" },
  { label: "Comprar WhatsApp", icon: ShoppingCart, to: "/app/comprar-whatsapp" },
  { label: "Configurações", icon: Settings, to: "/app/configuracoes" },
];

export function AppSidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [openGroup, setOpenGroup] = useState(pathname.startsWith("/app/blacklist"));

  const isActive = (to: string) => (to === "/app" ? pathname === "/app" : pathname.startsWith(to));

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="border-b border-sidebar-border px-4 py-4">
        <Link to="/" onClick={onNavigate}>
          <Logo />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.map((item) =>
          item.children ? (
            <div key={item.label}>
              <button
                type="button"
                onClick={() => setOpenGroup((v) => !v)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  pathname.startsWith("/app/blacklist")
                    ? "bg-primary/12 text-primary ring-1 ring-primary/25"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
                aria-expanded={openGroup}
              >
                <item.icon className="size-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
                <ChevronDown
                  className={cn(
                    "size-3.5 shrink-0 transition-transform",
                    openGroup && "rotate-180",
                  )}
                />
              </button>
              {openGroup ? (
                <div className="mt-1 ml-6 space-y-1 border-l border-sidebar-border pl-3">
                  {item.children.map((c) => (
                    <Link
                      key={c.to}
                      to={c.to}
                      onClick={onNavigate}
                      className={cn(
                        "block w-full truncate rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                        isActive(c.to)
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <Link
              key={item.label}
              to={item.to!}
              onClick={onNavigate}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors",
                isActive(item.to!)
                  ? "bg-primary/12 text-primary ring-1 ring-primary/25"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="size-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
            </Link>
          ),
        )}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl bg-sidebar-accent/60 px-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{PANEL_USER.fullName}</p>
            <p className="truncate text-xs text-primary">{PANEL_USER.plan}</p>
          </div>
          <div className="flex shrink-0 gap-1">
            <Link
              to="/app/configuracoes"
              onClick={onNavigate}
              aria-label="Configurações"
              className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
            >
              <Settings className="size-4" />
            </Link>
            <Link
              to="/login"
              aria-label="Sair"
              className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
            >
              <LogOut className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
