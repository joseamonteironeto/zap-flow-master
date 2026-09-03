import { createFileRoute } from "@tanstack/react-router";
import { Activity, Bot, ChevronRight, Clock3, MoreHorizontal, Plus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { ReactionRuleEditor, type ReactionRuleData } from "@/components/app/ReactionRuleEditor";
import { Card, PageHeader, Pill, StatCard } from "@/components/app/Ui";
import { Bars } from "@/components/mockups/Panel";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/reacoes")({
  head: () => ({ meta: [{ title: "Reações | Painel TudoZap" }, { name: "description", content: "Crie e edite regras de reações automáticas por grupo, palavra-chave, emoji, range de bots e delay individual." }, { name: "robots", content: "noindex" }] }),
  component: ReactionsPage,
});

const DEFAULT_RULES: ReactionRuleData[] = [
  { id: 1, name: "Campanhas e promoções", groups: ["Ofertas Premium", "Comunidade Principal", "Clube de Benefícios"], keywords: ["promoção", "oferta", "desconto", "cupom"], emojis: ["🔥", "😍", "🚀"], minBots: 30, maxBots: 50, minDelay: 2, maxDelay: 5, adminsOnly: true, today: 1284, total: 18240, success: 97.8, active: true },
  { id: 2, name: "Agradecimentos", groups: ["Todos os grupos"], keywords: ["obrigado", "valeu", "gratidão"], emojis: ["👍", "❤️", "🙏"], minBots: 15, maxBots: 25, minDelay: 1, maxDelay: 10, adminsOnly: true, today: 942, total: 11905, success: 99.1, active: true },
  { id: 3, name: "Pedidos confirmados", groups: ["Suporte Nível 1", "Clientes VIP"], keywords: ["pedido confirmado", "pagamento aprovado"], emojis: ["✅", "🎉"], minBots: 8, maxBots: 12, minDelay: 1, maxDelay: 3, adminsOnly: true, today: 611, total: 7480, success: 96.4, active: true },
  { id: 4, name: "Boas-vindas", groups: ["Comunidade Principal"], keywords: ["bem-vindo", "entrou no grupo"], emojis: ["👋", "💚"], minBots: 10, maxBots: 20, minDelay: 1, maxDelay: 60, adminsOnly: true, today: 410, total: 5126, success: 94.7, active: false },
];

const TOP_GROUPS = [["Ofertas Premium", "824", 100], ["Comunidade Principal", "671", 81], ["Clube de Benefícios", "438", 53], ["Clientes VIP", "294", 36]] as const;

function RuleCard({ rule, onToggle, onEdit }: { rule: ReactionRuleData; onToggle: (active: boolean) => void; onEdit: () => void }) {
  const groupCount = rule.groups.includes("Todos os grupos") ? 94 : rule.groups.length;
  return (
    <article className={cn("rounded-2xl border border-border bg-surface/60 transition-colors", !rule.active && "opacity-65")}>
      <header className="flex items-start justify-between gap-4 border-b border-border px-4 py-4 sm:px-5">
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold tracking-tight">{rule.name}</h2><Pill tone={rule.active ? "success" : "muted"}>{rule.active ? "Ativa" : "Pausada"}</Pill></div><p className="mt-1 text-xs text-muted-foreground">{rule.today.toLocaleString("pt-BR")} reações hoje • {rule.total.toLocaleString("pt-BR")} no total</p></div>
        <div className="flex shrink-0 items-center gap-2"><Switch checked={rule.active} onCheckedChange={onToggle} aria-label={`${rule.active ? "Pausar" : "Ativar"} ${rule.name}`} /><Button variant="ghost" size="icon" className="size-8" onClick={onEdit} aria-label={`Editar ${rule.name}`}><MoreHorizontal className="size-4" /></Button></div>
      </header>

      <div className="grid gap-5 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-[1.15fr_1.15fr_.7fr_.72fr_.72fr]">
        <div><p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground"><Users className="size-3.5" /> Grupos</p><p className="mt-2 text-sm font-medium">{rule.groups[0]}</p><p className="mt-1 text-xs text-muted-foreground">{groupCount === 1 ? "1 grupo selecionado" : `${groupCount} grupos selecionados`}</p></div>
        <div><p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Palavras-chave</p><div className="mt-2 flex flex-wrap gap-1.5">{rule.keywords.slice(0, 3).map((keyword) => <span key={keyword} className="rounded-md border border-border bg-background px-2 py-1 text-xs">{keyword}</span>)}{rule.keywords.length > 3 ? <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">+{rule.keywords.length - 3}</span> : null}</div></div>
        <div><p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Emojis</p><div className="mt-2 flex -space-x-1">{rule.emojis.map((emoji) => <span key={emoji} className="grid size-8 place-items-center rounded-full border border-border bg-background text-base shadow-sm">{emoji}</span>)}</div></div>
        <div><p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground"><Bot className="size-3.5" /> Bots por mensagem</p><p className="mt-2 text-lg font-semibold tabular-nums">{rule.minBots}–{rule.maxBots}</p><p className="text-xs text-muted-foreground">range automático</p></div>
        <div><p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground"><Clock3 className="size-3.5" /> Delay aleatório</p><p className="mt-2 text-lg font-semibold tabular-nums">{rule.minDelay ?? 2}–{rule.maxDelay ?? 5} min</p><p className="text-xs text-muted-foreground">por bot</p></div>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/25 px-4 py-3 sm:px-5"><div className="flex flex-wrap items-center gap-3"><span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Activity className="size-3.5 text-primary" /> {rule.success.toLocaleString("pt-BR")}% de execução</span><Pill tone={(rule.adminsOnly ?? true) ? "success" : "muted"}>{(rule.adminsOnly ?? true) ? "Só administradores" : "Todos os membros"}</Pill></div><Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={onEdit}>Editar regra <ChevronRight className="size-3.5" /></Button></footer>
    </article>
  );
}

function ReactionsPage() {
  const [rules, setRules] = useState<ReactionRuleData[]>(DEFAULT_RULES);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ReactionRuleData | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("tudozap-reaction-rules");
    if (stored) { try { setRules((JSON.parse(stored) as ReactionRuleData[]).map((rule) => ({ ...rule, minDelay: rule.minDelay ?? 2, maxDelay: rule.maxDelay ?? 5, adminsOnly: rule.adminsOnly ?? true }))); } catch { /* mantém os dados de demonstração */ } }
    setHydrated(true);
  }, []);
  useEffect(() => { if (hydrated) window.localStorage.setItem("tudozap-reaction-rules", JSON.stringify(rules)); }, [rules, hydrated]);

  const openNew = () => { setEditingRule(null); setEditorOpen(true); };
  const openEdit = (rule: ReactionRuleData) => { setEditingRule(rule); setEditorOpen(true); };
  const saveRule = (next: ReactionRuleData) => setRules((current) => current.some((rule) => rule.id === next.id) ? current.map((rule) => rule.id === next.id ? next : rule) : [next, ...current]);
  const toggleRule = (id: number, active: boolean) => setRules((current) => current.map((rule) => rule.id === id ? { ...rule, active } : rule));

  return (
    <>
      <PageHeader title="Reações automáticas" subtitle="Controle onde, quando e como seus bots reagem às mensagens" actions={<Button size="sm" onClick={openNew}><Plus className="size-4" /> Nova regra</Button>} />
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4"><StatCard label="Reações hoje" value={rules.reduce((sum, rule) => sum + rule.today, 0).toLocaleString("pt-BR")} delta="+18% vs. ontem" /><StatCard label="Mensagens reagidas" value="1.086" delta="média de 3 por mensagem" /><StatCard label="Regras ativas" value={`${rules.filter((rule) => rule.active).length}`} delta={`de ${rules.length} configuradas`} /><StatCard label="Taxa de execução" value="97,6%" delta="+1,2% esta semana" /></section>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,.75fr)]">
        <section className="space-y-4" aria-label="Regras de reação"><div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-semibold">Regras configuradas</h2><p className="text-xs text-muted-foreground">Clique em uma regra para editar grupos, gatilhos, emojis e bots</p></div><Pill>{rules.length} regras</Pill></div>{rules.map((rule) => <RuleCard key={rule.id} rule={rule} onToggle={(active) => toggleRule(rule.id, active)} onEdit={() => openEdit(rule)} />)}</section>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <Card title="Volume de reações" description="Últimos 7 dias" actions={<Pill tone="success">+18%</Pill>}><Bars data={[36, 42, 38, 55, 49, 67, 76]} className="h-32" /><div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground"><span>27 ago</span><span>Hoje</span></div></Card>
          <Card title="Grupos com mais reações" description="Hoje"><div className="space-y-4">{TOP_GROUPS.map(([name, count, width]) => <div key={name}><div className="mb-1.5 flex items-center justify-between gap-3 text-xs"><span className="truncate font-medium">{name}</span><span className="tabular-nums text-muted-foreground">{count}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} /></div></div>)}</div></Card>
          <Card title="Emojis mais usados" description="Distribuição de hoje"><div className="grid grid-cols-3 gap-2">{[["🔥", "31%"], ["👍", "24%"], ["✅", "18%"], ["❤️", "14%"], ["😍", "8%"], ["Outros", "5%"]].map(([emoji, value]) => <div key={emoji} className="rounded-xl border border-border bg-background p-2.5 text-center"><p className="text-lg">{emoji}</p><p className="mt-1 text-xs font-semibold">{value}</p></div>)}</div></Card>
          <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-credit/55 p-4"><Clock3 className="mt-0.5 size-4 shrink-0 text-primary" /><p className="text-xs leading-relaxed text-muted-foreground"><strong className="text-foreground">Distribuição natural:</strong> a quantidade de bots e o delay individual são sorteados dentro dos ranges configurados.</p></div>
        </aside>
      </div>

      <ReactionRuleEditor open={editorOpen} rule={editingRule} onOpenChange={setEditorOpen} onSave={saveRule} />
    </>
  );
}
