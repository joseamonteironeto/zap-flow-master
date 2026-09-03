import { Outlet, createFileRoute } from "@tanstack/react-router";
import { Bell, Menu, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { AppSidebarContent } from "@/components/app/AppSidebar";
import { Logo } from "@/components/brand/Logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CreditsWidget } from "@/components/app/CreditsWidget";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ensureCleanPanelStorage } from "@/lib/panel-data";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Painel | TudoZap" },
      {
        name: "description",
        content:
          "Painel TudoZap: grupos, contatos, automações, blacklist, CRM e relatórios da sua operação no WhatsApp.",
      },
      { property: "og:title", content: "Painel | TudoZap" },
      {
        property: "og:description",
        content: "Acompanhe e gerencie sua operação de WhatsApp pelo painel TudoZap.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AppLayout,
});

function AppLayout() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    ensureCleanPanelStorage();
  }, []);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="hidden border-r border-sidebar-border lg:block">
        <div className="sticky top-0 h-screen">
          <AppSidebarContent />
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden" aria-label="Abrir menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[86vw] max-w-xs border-sidebar-border p-0">
                <AppSidebarContent onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>

            <div className="lg:hidden">
              <Logo className="h-8 text-lg" />
            </div>

            <div className="relative hidden min-w-0 flex-1 max-w-sm lg:block">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar grupos, contatos, automações..." className="pl-9" />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <CreditsWidget />
            <ThemeToggle />
            <Button variant="outline" size="icon" aria-label="Notificações">
              <Bell className="size-4" />
            </Button>
            <Badge className="hidden md:inline-flex">Conectado</Badge>
          </div>
        </header>

        <main className="space-y-6 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
