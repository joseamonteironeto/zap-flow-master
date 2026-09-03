import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Reveal, SectionHeading } from "@/components/site/Reveal";
import {
  BenefitsBar,
  Faq,
  FeatureBlock,
  FeatureGrid,
  FinalCta,
  HowItWorks,
  Pricing,
  Solutions,
} from "@/components/site/Sections";
import { DashboardMock } from "@/components/mockups/DashboardMock";
import {
  AutoReplyMock,
  BigDashboardMock,
  BlacklistUsersMock,
  CrmMock,
  FiscalMock,
  FlowMock,
  GroupsMock,
  ReactionsMock,
  WordsUrlsMock,
} from "@/components/mockups/FeatureMocks";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TudoZap | Gestão e Automação para WhatsApp" },
      {
        name: "description",
        content: "Automatize grupos, atendimento e contatos do WhatsApp com CRM, regras e relatórios em um único painel.",
      },
      { property: "og:title", content: "TudoZap | Gestão e Automação para WhatsApp" },
      {
        property: "og:description",
        content: "Automatize grupos, atendimento e contatos do WhatsApp com CRM, regras e relatórios em um único painel.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Hero() {
  return (
    <section id="inicio" className="relative overflow-hidden hero-gradient pt-28 pb-16 sm:pt-36">
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-50" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3.5 py-1.5 text-xs text-muted-foreground"
          >
            <span className="size-1.5 rounded-full bg-primary" />
            Plataforma completa de operação no WhatsApp
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl lg:leading-[1.05]"
          >
            Tudo que você precisa para gerenciar seu{" "}
            <span className="text-gradient">WhatsApp</span> em um só lugar.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16 }}
            className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            Automatize tarefas, gerencie grupos, aumente o engajamento, organize seus contatos e
            transforme seu WhatsApp em uma verdadeira central de operação.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center"
          >
            <Button asChild size="lg" className="h-12 px-7 text-base">
              <Link to="/cadastro">Começar agora</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-7 text-base">
              <a href="#recursos">Conhecer recursos</a>
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.34 }}
            className="mt-5 text-xs text-muted-foreground sm:text-sm"
          >
            Configuração simples • Painel completo • Gestão em tempo real
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mx-auto mt-14 max-w-5xl"
        >
          <DashboardMock />
        </motion.div>
      </div>
    </section>
  );
}

function Landing() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <BenefitsBar />
        <FeatureGrid />

        <FeatureBlock
          eyebrow="Grupos"
          title="Gerenciamento de grupos"
          description="Gerencie seus grupos em um único painel, acompanhe atividades e tenha uma visão centralizada de toda a sua operação."
          bullets={[
            "Participantes, status e atividade em tempo real",
            "Filtros por ativos, pausados e monitorados",
            "Automações ativas visíveis por grupo",
          ]}
          media={<GroupsMock />}
        />

        <FeatureBlock
          reverse
          eyebrow="Engajamento"
          title="Reações automáticas para engajamento"
          description="Configure reações automáticas para determinadas mensagens e mantenha suas comunidades mais ativas de forma automatizada."
          bullets={[
            "Percentual de mensagens e intervalo configuráveis",
            "Seleção de grupos e tipos de reação",
            "Comportamento natural, sem parecer robô",
          ]}
          media={<ReactionsMock />}
        />

        <FeatureBlock
          eyebrow="Blacklist"
          title="Blacklist de usuários indesejados"
          description="Cadastre usuários que não devem permanecer em determinados grupos e automatize a identificação desses contatos."
          bullets={["Motivo, data e status de cada bloqueio", "Histórico completo por contato"]}
          media={<BlacklistUsersMock />}
        />

        <FeatureBlock
          reverse
          eyebrow="Segurança"
          title="Bloqueio de palavras e URLs"
          description="Defina termos, links e padrões que não são permitidos em seus grupos e mantenha suas comunidades organizadas."
          bullets={[
            "Palavras e domínios em listas editáveis",
            "Bloqueio de URLs desconhecidas",
            "Aviso ao administrador ou ação automática",
          ]}
          media={<WordsUrlsMock />}
        />

        <FeatureBlock
          eyebrow="Fiscal"
          title="Fiscal automático de grupos"
          description="Monitore grupos abertos automaticamente e identifique comportamentos ou conteúdos que estejam fora das regras definidas pela sua operação."
          bullets={["Varredura contínua de mensagens", "Alertas e ações automáticas registradas"]}
          media={<FiscalMock />}
        />

        <FeatureBlock
          reverse
          eyebrow="Atendimento"
          title="Respostas automáticas no WhatsApp"
          description="Configure respostas para dúvidas frequentes, comandos, palavras-chave ou situações específicas e reduza drasticamente o trabalho manual."
          bullets={["Construtor visual de regras SE / ENTÃO", "Encaminhamento para atendimento humano"]}
          media={<AutoReplyMock />}
        />

        <section id="crm" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="CRM"
            title="CRM integrado ao seu WhatsApp"
            description="Transforme conversas e contatos em oportunidades organizadas dentro de um CRM totalmente integrado à operação."
          />
          <Reveal delay={0.1} className="mt-12 max-w-none">
            <CrmMock />
          </Reveal>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Automações"
            title="Crie regras. O TudoZap executa."
            description="Cada mensagem passa por uma análise automática e segue o caminho que você definiu."
          />
          <Reveal delay={0.1} className="mt-12 max-w-none">
            <FlowMock />
          </Reveal>
        </section>

        <HowItWorks />

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Dashboard"
            title="Toda sua operação em uma única tela"
            description="Indicadores, gráficos e atividade em tempo real reunidos em um painel feito para decisão rápida."
          />
          <Reveal delay={0.1} className="mt-12 max-w-none">
            <BigDashboardMock />
          </Reveal>
        </section>

        <Solutions />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
