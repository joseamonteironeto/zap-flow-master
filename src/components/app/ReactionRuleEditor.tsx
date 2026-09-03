import { Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export type ReactionRuleData = {
  id: number;
  name: string;
  groups: string[];
  keywords: string[];
  emojis: string[];
  minBots: number;
  maxBots: number;
  minDelay: number;
  maxDelay: number;
  adminsOnly: boolean;
  today: number;
  total: number;
  success: number;
  active: boolean;
};

const GROUPS = ["Todos os grupos", "Ofertas Premium", "Comunidade Principal", "Clube de Benefícios", "Suporte Nível 1", "Clientes VIP", "Lançamentos", "Afiliados TudoZap"];
const EMOJIS = ["🔥", "👍", "❤️", "✅", "😍", "🚀", "🙏", "🎉", "👋", "💚", "👏", "💯"];

const blankRule = (): ReactionRuleData => ({ id: Date.now(), name: "", groups: [], keywords: [], emojis: [], minBots: 10, maxBots: 20, minDelay: 2, maxDelay: 5, adminsOnly: true, today: 0, total: 0, success: 100, active: true });

export function ReactionRuleEditor({ open, rule, onOpenChange, onSave }: { open: boolean; rule: ReactionRuleData | null; onOpenChange: (open: boolean) => void; onSave: (rule: ReactionRuleData) => void }) {
  const [form, setForm] = useState<ReactionRuleData>(blankRule);
  const [keywordInput, setKeywordInput] = useState("");
  const [customEmoji, setCustomEmoji] = useState("");

  useEffect(() => {
    if (open) {
      setForm(rule ? { ...rule, minDelay: rule.minDelay ?? 2, maxDelay: rule.maxDelay ?? 5, adminsOnly: rule.adminsOnly ?? true, groups: [...rule.groups], keywords: [...rule.keywords], emojis: [...rule.emojis] } : blankRule());
      setKeywordInput("");
      setCustomEmoji("");
    }
  }, [open, rule]);

  const valid = useMemo(() => form.name.trim() && form.groups.length && form.keywords.length && form.emojis.length && form.minBots > 0 && form.maxBots >= form.minBots && form.minDelay >= 1 && form.maxDelay >= form.minDelay, [form]);

  const toggleGroup = (group: string, checked: boolean) => {
    setForm((current) => ({
      ...current,
      groups: group === "Todos os grupos"
        ? checked ? [group] : []
        : checked ? [...current.groups.filter((item) => item !== "Todos os grupos"), group] : current.groups.filter((item) => item !== group),
    }));
  };

  const addKeyword = () => {
    const next = keywordInput.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
    if (!next.length) return;
    setForm((current) => ({ ...current, keywords: [...new Set([...current.keywords, ...next])] }));
    setKeywordInput("");
  };

  const toggleEmoji = (emoji: string) => setForm((current) => ({ ...current, emojis: current.emojis.includes(emoji) ? current.emojis.filter((item) => item !== emoji) : [...current.emojis, emoji] }));

  const addCustomEmoji = () => {
    const emoji = customEmoji.trim();
    if (!emoji) return;
    setForm((current) => ({ ...current, emojis: [...new Set([...current.emojis, emoji])] }));
    setCustomEmoji("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100%-1.5rem)] overflow-y-auto rounded-2xl border-border bg-popover p-0 sm:max-w-3xl">
        <DialogHeader className="border-b border-border bg-credit/45 px-5 py-5 sm:px-6">
          <DialogTitle>{rule ? "Editar regra de reação" : "Nova regra de reação"}</DialogTitle>
          <DialogDescription>Configure grupos, gatilhos, emojis, quantidade de bots e o delay individual das reações.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 px-5 sm:px-6">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="rule-name">Nome da regra</Label>
              <Input id="rule-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Ex.: Campanhas e promoções" />
            </div>
            <label className="flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm"><Switch checked={form.active} onCheckedChange={(active) => setForm((current) => ({ ...current, active }))} /> Regra ativa</label>
          </div>

          <section>
            <div className="mb-3"><h3 className="text-sm font-semibold">Em quais grupos irá reagir?</h3><p className="text-xs text-muted-foreground">Selecione um ou vários grupos.</p></div>
            <div className="grid gap-2 sm:grid-cols-2">
              {GROUPS.map((group) => {
                const checked = form.groups.includes(group);
                const disabled = form.groups.includes("Todos os grupos") && group !== "Todos os grupos";
                return <label key={group} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 text-sm hover:bg-muted/45", checked && "border-primary bg-credit", disabled && "cursor-not-allowed opacity-45")}><Checkbox checked={checked} disabled={disabled} onCheckedChange={(value) => toggleGroup(group, value === true)} /><span className="min-w-0 truncate">{group}</span></label>;
              })}
            </div>
          </section>

          <section>
            <div className="mb-3"><h3 className="text-sm font-semibold">Palavras-chave</h3><p className="text-xs text-muted-foreground">A reação será disparada quando a mensagem contiver uma destas palavras ou frases.</p></div>
            <div className="flex gap-2"><Input value={keywordInput} onChange={(event) => setKeywordInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addKeyword(); } }} placeholder="Digite e pressione Enter; separe por vírgulas" /><Button type="button" variant="outline" onClick={addKeyword}><Plus className="size-4" /> Adicionar</Button></div>
            <div className="mt-3 flex min-h-9 flex-wrap gap-2">
              {form.keywords.map((keyword) => <span key={keyword} className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-credit px-3 py-1.5 text-xs font-medium">{keyword}<button type="button" onClick={() => setForm((current) => ({ ...current, keywords: current.keywords.filter((item) => item !== keyword) }))} aria-label={`Remover ${keyword}`}><X className="size-3" /></button></span>)}
              {!form.keywords.length ? <p className="text-xs text-muted-foreground">Adicione pelo menos uma palavra-chave.</p> : null}
            </div>
          </section>

          <section>
            <div className="mb-3"><h3 className="text-sm font-semibold">Quais emojis os bots poderão usar?</h3><p className="text-xs text-muted-foreground">Em cada reação, um emoji selecionado será escolhido aleatoriamente.</p></div>
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">{EMOJIS.map((emoji) => <button key={emoji} type="button" onClick={() => toggleEmoji(emoji)} className={cn("grid aspect-square place-items-center rounded-xl border border-border bg-background text-xl transition-colors hover:bg-muted", form.emojis.includes(emoji) && "border-primary bg-credit ring-1 ring-primary/25")}>{emoji}</button>)}</div>
            <div className="mt-3 flex gap-2"><Input value={customEmoji} onChange={(event) => setCustomEmoji(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addCustomEmoji(); } }} placeholder="Adicionar outro emoji" className="max-w-xs" /><Button type="button" variant="outline" onClick={addCustomEmoji}>Adicionar</Button></div>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-border bg-muted/25 p-4">
              <div className="mb-4"><h3 className="text-sm font-semibold">Range de bots por mensagem</h3><p className="text-xs text-muted-foreground">O sistema escolherá uma quantidade aleatória dentro do intervalo.</p></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="min-bots">Mínimo de bots</Label><Input id="min-bots" type="number" min="1" value={form.minBots} onChange={(event) => setForm((current) => ({ ...current, minBots: Math.max(1, Number(event.target.value)) }))} /></div>
                <div className="space-y-2"><Label htmlFor="max-bots">Máximo de bots</Label><Input id="max-bots" type="number" min={form.minBots} value={form.maxBots} onChange={(event) => setForm((current) => ({ ...current, maxBots: Math.max(1, Number(event.target.value)) }))} /></div>
              </div>
              <p className={cn("mt-3 rounded-lg px-3 py-2 text-xs", form.maxBots >= form.minBots ? "bg-credit text-foreground" : "bg-destructive/10 text-destructive")}>{form.maxBots >= form.minBots ? `Entre ${form.minBots} e ${form.maxBots} bots reagirão a cada mensagem compatível.` : "O máximo precisa ser maior ou igual ao mínimo."}</p>
            </section>

            <section className="rounded-2xl border border-border bg-muted/25 p-4">
              <div className="mb-4"><h3 className="text-sm font-semibold">Delay aleatório entre reações</h3><p className="text-xs text-muted-foreground">Cada bot escolherá individualmente quando reagir, em minutos.</p></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="min-delay">Mínimo (minutos)</Label><Input id="min-delay" type="number" min="1" max="1440" value={form.minDelay} onChange={(event) => setForm((current) => ({ ...current, minDelay: Math.max(1, Number(event.target.value)) }))} /></div>
                <div className="space-y-2"><Label htmlFor="max-delay">Máximo (minutos)</Label><Input id="max-delay" type="number" min={form.minDelay} max="1440" value={form.maxDelay} onChange={(event) => setForm((current) => ({ ...current, maxDelay: Math.max(1, Number(event.target.value)) }))} /></div>
              </div>
              <p className={cn("mt-3 rounded-lg px-3 py-2 text-xs", form.maxDelay >= form.minDelay ? "bg-credit text-foreground" : "bg-destructive/10 text-destructive")}>{form.maxDelay >= form.minDelay ? `Cada bot reagirá em um momento sorteado entre ${form.minDelay} e ${form.maxDelay} minutos após a mensagem.` : "O delay máximo precisa ser maior ou igual ao mínimo."}</p>
            </section>
          </div>

          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-credit/55 p-4">
            <span><span className="block text-sm font-semibold">Reagir apenas a mensagens de administradores</span><span className="mt-1 block text-xs text-muted-foreground">Quando ligada, mensagens de membros comuns serão ignoradas por esta regra.</span></span>
            <Switch checked={form.adminsOnly} onCheckedChange={(adminsOnly) => setForm((current) => ({ ...current, adminsOnly }))} aria-label="Reagir apenas a mensagens de administradores" />
          </label>
        </div>

        <DialogFooter className="mt-2 border-t border-border px-5 py-4 sm:px-6">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="button" disabled={!valid} onClick={() => { onSave({ ...form, name: form.name.trim() }); onOpenChange(false); }}>{rule ? "Salvar alterações" : "Criar regra"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
