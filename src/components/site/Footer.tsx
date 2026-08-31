import { Logo } from "@/components/brand/Logo";

const COLUMNS = [
  { title: "Produto", links: ["Recursos", "Automações", "CRM", "Planos"] },
  { title: "Empresa", links: ["Sobre", "Contato", "Suporte"] },
  { title: "Legal", links: ["Termos de Uso", "Política de Privacidade", "Política de Cookies"] },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface/40">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Automação, gestão e inteligência para sua operação no WhatsApp.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold">{col.title}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
          © 2026 TudoZap. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
