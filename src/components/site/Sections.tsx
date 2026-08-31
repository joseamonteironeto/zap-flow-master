import { Link } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  Bot,
  Building2,
  Check,
  Layers,
  Megaphone,
  MessageSquare,
  Rocket,
  Shield,
  ShieldBan,
  Sparkles,
  Smile,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Reveal, SectionHeading } from "@/components/site/Reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ---------- Benefícios rápidos ---------- */

const BENEFITS = [
  { icon: Bot, label: "Automação" },
  { icon: Shield, label: "Controle" },
  { icon: Activity, label: "Engajamento" },
  { icon: Layers, label: "Organização" },
  { icon: Rocket, label: "Escalabilidade" },
];

export function BenefitsBar() {
  return (
    <section className="border-y border-border bg-surface/40">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 py-6 sm:grid-cols-3 sm:px-6 lg:grid-cols-5 lg:px-8">
        {BENEFITS.map((b, i) => (
          <Reveal key={b.label} delay={i * 0.06}>
            <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface/60 px-3.5 py-3">
              <b.icon className="size-4 shrink-0 text-primary" />
              <span className="min-w-0 truncate text-sm font-medium">{b.label}</span>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- Grade de recursos ---------- */

const FEATURES = [
  {
    icon: Users,
    title: "Gerenciamento de grupos",
    text: "Todos os grupos em um painel único, com atividade e automações à vista.",
  },
  {
    icon: Smile,
    title: "Reações automáticas",
    text: "Mantenha comunidades ativas com reações inteligentes e naturais.",
  },
  {
    icon: ShieldBan,
    title: "Blacklist de usuários",
    text: "Identifique e trate contatos indesejados automaticamente.",
  },
  {
    icon: Zap,
    title: "Palavras e URLs",
    text: "Bloqueie termos, links e padrões fora das regras da sua operação.",
  },
  {
    icon: Shield,
    title: "Fiscal automático",
    text: "Monitoramento contínuo de grupos abertos com alertas em tempo real.",
  },
  {
    icon: MessageSquare,
    title: "Respostas automáticas",
    text: "Responda dúvidas, comandos e palavras-chave sem trabalho manual.",
  },
  {
    icon: Layers,
    title: "CRM integrado",
    text: "Conversas viram oportunidades organizadas em funil visual.",
  },
  {
    icon: BarChart3,
    title: "Relatórios e métricas",
    text: "Acompanhe interações, automações e conversões da operação.",
  },
];

export function FeatureGrid() {
  return (
    <section id="recursos" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Recursos"
        title="Controle total. Menos trabalho manual."
        description="Centralize operações que antes exigiam acompanhamento constante em uma única plataforma inteligente."
      />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={(i % 4) * 0.06}>
            <article className="group h-full rounded-2xl border border-border bg-surface/50 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-surface/80">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/12 ring-1 ring-primary/20">
                <f.icon className="size-5 text-primary" />
              </span>
              <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- Bloco de recurso com mockup ---------- */

export function FeatureBlock({
  id,
  eyebrow,
  title,
  description,
  bullets,
  media,
  reverse,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  bullets?: string[];
  media: React.ReactNode;
  reverse?: boolean;
}) {
  return (
    <section id={id} className="mx-auto max-w-7xl scroll-mt-24 px-4 py-14 sm:px-6 lg:px-8">
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
        <Reveal className={cn("min-w-0", reverse && "lg:order-2")}>
          <span className="text-xs font-medium tracking-wide text-primary uppercase">{eyebrow}</span>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:text-3xl md:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">{description}</p>
          {bullets ? (
            <ul className="mt-6 space-y-3">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="min-w-0 text-foreground/85">{b}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </Reveal>
        <Reveal delay={0.1} className="min-w-0">
          {media}
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Como funciona ---------- */

const STEPS = [
  ["01", "Crie sua conta", "Configure sua conta TudoZap em poucos minutos."],
  ["02", "Conecte sua operação", "Adicione os grupos, contatos ou canais que deseja gerenciar."],
  ["03", "Configure suas regras", "Defina automações, respostas, blacklist e monitoramento."],
  ["04", "Acompanhe pelo painel", "Visualize tudo pelo dashboard e acompanhe em tempo real."],
];

export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8"
    >
      <SectionHeading
        eyebrow="Como funciona"
        title="Da conta criada à operação rodando sozinha"
        description="Quatro etapas simples para transformar seu WhatsApp em uma central de operação."
      />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(([num, title, text], i) => (
          <Reveal key={num} delay={i * 0.08}>
            <div className="relative h-full rounded-2xl border border-border bg-surface/50 p-5">
              <span className="text-sm font-semibold text-primary">{num}</span>
              <h3 className="mt-3 text-base font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- Soluções ---------- */

const PERSONAS = [
  { icon: Users, title: "Comunidades", text: "Gerencie grandes comunidades e múltiplos grupos." },
  { icon: Megaphone, title: "Marketing", text: "Automatize interações e acompanhe contatos." },
  { icon: MessageSquare, title: "Atendimento", text: "Organize conversas e reduza tarefas repetitivas." },
  { icon: Building2, title: "Empresas", text: "Centralize equipes, contatos e processos." },
  { icon: Sparkles, title: "Infoprodutores", text: "Organize comunidades, leads e atendimento." },
  { icon: Layers, title: "Agências", text: "Gerencie operações de diferentes projetos em um só lugar." },
];

export function Solutions() {
  return (
    <section id="solucoes" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Soluções"
        title="Feito para quem gerencia WhatsApp em escala"
      />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PERSONAS.map((p, i) => (
          <Reveal key={p.title} delay={(i % 3) * 0.06}>
            <article className="h-full rounded-2xl border border-border bg-surface/50 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30">
              <p.icon className="size-5 text-primary" />
              <h3 className="mt-4 text-base font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.text}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- Planos ---------- */

const PLANS = [
  {
    name: "Starter",
    text: "Para pequenas operações.",
    monthly: "R$ 97",
    yearly: "R$ 78",
    features: ["Até 10 grupos", "Respostas automáticas", "Blacklist de palavras", "1 usuário"],
  },
  {
    name: "Pro",
    text: "Para operações em crescimento.",
    monthly: "R$ 197",
    yearly: "R$ 158",
    highlight: true,
    features: [
      "Até 50 grupos",
      "Reações e fiscal automático",
      "CRM integrado",
      "5 usuários na equipe",
    ],
  },
  {
    name: "Business",
    text: "Para grandes operações e equipes.",
    monthly: "R$ 397",
    yearly: "R$ 318",
    features: ["Grupos ilimitados", "Relatórios avançados", "Integrações e API", "Equipe ilimitada"],
  },
];

export function Pricing() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="planos" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Planos"
        title="Escolha o plano da sua operação"
        description="Comece pequeno e escale conforme sua operação cresce. Troque de plano quando quiser."
      />

      <Reveal className="mx-auto mt-8 flex w-fit items-center gap-1 rounded-full border border-border bg-surface/70 p-1">
        {(["Mensal", "Anual"] as const).map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setYearly(i === 1)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              yearly === (i === 1)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
            {i === 1 ? <span className="ml-1.5 text-xs opacity-80">-20%</span> : null}
          </button>
        ))}
      </Reveal>
      {yearly ? (
        <p className="mt-3 text-center text-xs text-primary">Economize 20% no plano anual</p>
      ) : null}

      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {PLANS.map((p, i) => (
          <Reveal key={p.name} delay={i * 0.08}>
            <article
              className={cn(
                "relative flex h-full flex-col rounded-2xl border p-6",
                p.highlight
                  ? "border-primary/40 bg-surface/80 glow-ring"
                  : "border-border bg-surface/50",
              )}
            >
              {p.highlight ? (
                <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground">
                  Mais escolhido
                </span>
              ) : null}
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.text}</p>
              <p className="mt-6 flex items-baseline gap-1.5">
                <span className="text-4xl font-semibold tracking-tight">
                  {yearly ? p.yearly : p.monthly}
                </span>
                <span className="text-sm text-muted-foreground">/mês</span>
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span className="min-w-0 text-foreground/85">{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                size="lg"
                variant={p.highlight ? "default" : "outline"}
                className="mt-7 w-full"
              >
                <Link to="/cadastro">Começar agora</Link>
              </Button>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- FAQ ---------- */

const FAQS: [string, string][] = [
  [
    "O que é o TudoZap?",
    "O TudoZap é uma plataforma de gestão, automação, atendimento e organização de grupos e contatos no WhatsApp, com painel completo e CRM integrado.",
  ],
  [
    "Preciso instalar algum programa?",
    "Não. Todo o gerenciamento acontece pelo painel na web, acessível de qualquer dispositivo com internet.",
  ],
  [
    "Posso gerenciar vários grupos?",
    "Sim. Você pode monitorar e automatizar dezenas ou centenas de grupos, com filtros por status e atividade.",
  ],
  [
    "Como funcionam as automações?",
    "Você define gatilhos (palavras-chave, links, comportamento) e ações (responder, reagir, alertar, bloquear). O TudoZap executa em tempo real.",
  ],
  [
    "Posso criar minhas próprias regras?",
    "Sim. O construtor visual permite montar regras personalizadas sem escrever uma linha de código.",
  ],
  [
    "O TudoZap possui CRM?",
    "Sim. Contatos e conversas viram cards em um funil Kanban, com tags, responsável e histórico de interações.",
  ],
  [
    "Posso gerenciar minha equipe?",
    "Sim. Convide usuários, defina responsáveis por contatos e acompanhe a produtividade pelos relatórios.",
  ],
  [
    "Posso alterar meu plano posteriormente?",
    "Sim. O upgrade ou downgrade pode ser feito a qualquer momento direto no painel.",
  ],
];

export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-20 sm:px-6">
      <SectionHeading eyebrow="FAQ" title="Perguntas frequentes" />
      <Reveal className="mt-10 max-w-none">
        <Accordion type="single" collapsible className="w-full">
          {FAQS.map(([q, a], i) => (
            <AccordionItem
              key={q}
              value={`item-${i}`}
              className="mb-3 rounded-2xl border border-border bg-surface/50 px-5"
            >
              <AccordionTrigger className="text-left text-base hover:no-underline">
                {q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </section>
  );
}

/* ---------- CTA final ---------- */

export function FinalCta() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-primary/25 panel-gradient px-6 py-14 text-center sm:px-12">
          <div className="pointer-events-none absolute inset-0 grid-lines opacity-40" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Automatize hoje o que você ainda faz manualmente.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
              Comece a utilizar o TudoZap e centralize sua operação em uma única plataforma.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="h-12 px-7 text-base">
                <Link to="/cadastro">Criar minha conta</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-7 text-base">
                <a href="#como-funciona">Ver como funciona</a>
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
