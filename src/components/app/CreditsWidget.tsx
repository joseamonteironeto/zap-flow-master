import { Check, CheckCircle2, Clipboard, Coins, Loader2, Plus, QrCode, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CREDIT_PACKAGES, calculateCreditPrice } from "@/lib/credits";
import { ensureCleanPanelStorage, PANEL_USER } from "@/lib/panel-data";
import { cn } from "@/lib/utils";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

type PixPayment = {
  id: number; status: string; expiresAt?: string; qrCode: string; qrCodeBase64: string;
  ticketUrl?: string; credits: number; amount: number;
};

export function CreditsWidget() {
  const [selected, setSelected] = useState<number | null>(1);
  const [customCredits, setCustomCredits] = useState("");
  const [balance, setBalance] = useState(0);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"amount" | "payer" | "pix" | "done">("amount");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [pix, setPix] = useState<PixPayment | null>(null);
  const [payer, setPayer] = useState({ fullName: PANEL_USER.fullName, documentType: "CPF" as "CPF" | "CNPJ", documentNumber: "" });

  useEffect(() => {
    ensureCleanPanelStorage();
    const stored = window.localStorage.getItem("tudozap-credits");
    if (stored && Number.isFinite(Number(stored))) setBalance(Number(stored));
  }, []);

  const chosenCredits = selected === null ? Math.max(0, Number(customCredits) || 0) : CREDIT_PACKAGES[selected].credits;
  const chosenPrice = calculateCreditPrice(chosenCredits);
  const documentLength = payer.documentType === "CPF" ? 11 : 14;
  const payerValid = payer.fullName.trim().length >= 3 && payer.documentNumber.replace(/\D/g, "").length === documentLength;

  const applyApprovedPayment = (paymentId: number, credits: number) => {
    const key = "tudozap-processed-payments";
    const processed = new Set<string>(JSON.parse(window.localStorage.getItem(key) || "[]"));
    if (!processed.has(String(paymentId))) {
      setBalance((current) => {
        const next = current + credits;
        window.localStorage.setItem("tudozap-credits", String(next));
        return next;
      });
      processed.add(String(paymentId));
      window.localStorage.setItem(key, JSON.stringify([...processed]));
    }
    setStep("done");
  };

  useEffect(() => {
    if (!pix || step !== "pix") return;
    const check = async () => {
      try {
        const response = await fetch(`/api/credits/status?id=${pix.id}`);
        if (!response.ok) return;
        const result = (await response.json()) as { approved?: boolean; credits?: number };
        if (result.approved && result.credits) applyApprovedPayment(pix.id, result.credits);
      } catch { /* A próxima consulta tentará novamente. */ }
    };
    void check();
    const timer = window.setInterval(check, 4_000);
    return () => window.clearInterval(timer);
  }, [pix, step]);

  const createPix = async () => {
    setLoading(true); setError(""); setErrorCode("");
    try {
      const response = await fetch("/api/credits/pix", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ credits: chosenCredits, ...payer }) });
      const result = (await response.json()) as PixPayment & { error?: string; code?: string };
      if (!response.ok) {
        setErrorCode(result.code || "");
        throw new Error(result.error || "Não foi possível gerar o Pix.");
      }
      setPix(result); setStep("pix");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível gerar o Pix.");
    } finally { setLoading(false); }
  };

  const reset = () => { setStep("amount"); setPix(null); setError(""); setErrorCode(""); setCopied(false); };
  const title = useMemo(() => step === "done" ? "Pagamento aprovado" : step === "pix" ? "Pague com Pix" : "Recarregar créditos", [step]);

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-10 gap-2 border-primary/25 bg-credit/60 px-2.5 shadow-sm hover:bg-credit sm:px-3" aria-label={`Abrir recarga de créditos. Saldo: ${balance.toLocaleString("pt-BR")} créditos`}>
          <span className="grid size-6 place-items-center rounded-md bg-primary text-primary-foreground"><Coins className="size-3.5" /></span>
          <span className="text-left leading-none"><span className="hidden text-[10px] font-medium text-muted-foreground sm:block">Créditos</span><span className="text-xs font-semibold tabular-nums sm:text-sm">{balance.toLocaleString("pt-BR")}</span></span>
          <Plus className="hidden size-3.5 text-primary sm:block" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[92vh] w-[calc(100%-2rem)] overflow-y-auto rounded-xl border-border bg-popover p-0 sm:max-w-xl">
        <div className="border-b border-border bg-credit/55 px-5 py-5 sm:px-6">
          <div className="mb-4 grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">{step === "pix" ? <QrCode className="size-5" /> : step === "done" ? <CheckCircle2 className="size-5" /> : <Coins className="size-5" />}</div>
          <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{step === "amount" ? "Escolha um pacote ou informe uma quantidade personalizada." : step === "payer" ? "Preencha os dados do pagador para gerar o QR Code." : step === "pix" ? "O saldo será liberado automaticamente após a aprovação." : "Os créditos já estão disponíveis no seu saldo."}</DialogDescription></DialogHeader>
        </div>

        <div className="space-y-3 px-5 py-4 sm:px-6">
          {step === "amount" && <>
            {CREDIT_PACKAGES.map((pack, index) => <Button key={pack.credits} type="button" variant="outline" onClick={() => { setSelected(index); setCustomCredits(""); }} className={cn("h-auto w-full justify-start whitespace-normal rounded-lg p-4 text-left shadow-none", selected === index && "border-primary bg-credit ring-1 ring-primary/25")}><span className={cn("grid size-5 shrink-0 place-items-center rounded-full border border-border", selected === index && "border-primary bg-primary text-primary-foreground")}>{selected === index ? <Check className="size-3" /> : null}</span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{pack.label} créditos</span><span className="block text-xs font-normal text-muted-foreground">{pack.detail}</span></span><span className="shrink-0 text-sm font-semibold">{currency.format(pack.price)}</span></Button>)}
            <div className={cn("rounded-xl border border-border p-4 transition-colors", selected === null && "border-primary bg-credit ring-1 ring-primary/25")}><div className="flex items-center justify-between gap-3"><label htmlFor="custom-credits" className="text-sm font-semibold">Quantidade personalizada</label>{selected === null && chosenCredits > 0 ? <span className="rounded-full bg-primary/12 px-2.5 py-1 text-xs font-semibold text-primary">{currency.format(chosenPrice)}</span> : null}</div><div className="relative mt-3"><Input id="custom-credits" type="number" min="1" max="1000000" step="1" inputMode="numeric" value={customCredits} onFocus={() => setSelected(null)} onChange={(event) => { setSelected(null); setCustomCredits(event.target.value.replace(/[^0-9]/g, "")); }} placeholder="Digite a quantidade" className="h-11 pr-20 text-base font-semibold tabular-nums" /><span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">créditos</span></div><p className="mt-2 text-xs text-muted-foreground">O preço acompanha os descontos dos pacotes atuais.</p></div>
          </>}

          {step === "payer" && <div className="space-y-4"><div className="rounded-xl border bg-muted/35 p-4"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Recarga</span><strong>{chosenCredits.toLocaleString("pt-BR")} créditos</strong></div><div className="mt-2 flex items-center justify-between"><span className="text-sm text-muted-foreground">Total</span><strong className="text-primary">{currency.format(chosenPrice)}</strong></div></div><div><label className="text-sm font-medium" htmlFor="payer-name">Nome completo</label><Input id="payer-name" className="mt-1.5" value={payer.fullName} onChange={(e) => setPayer({ ...payer, fullName: e.target.value })} autoComplete="name" /></div><div className="grid grid-cols-[110px_1fr] gap-3"><div><label className="text-sm font-medium" htmlFor="payer-document-type">Documento</label><select id="payer-document-type" className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={payer.documentType} onChange={(e) => setPayer({ ...payer, documentType: e.target.value as "CPF" | "CNPJ", documentNumber: "" })}><option>CPF</option><option>CNPJ</option></select></div><div><label className="text-sm font-medium" htmlFor="payer-document">Número</label><Input id="payer-document" className="mt-1.5" inputMode="numeric" value={payer.documentNumber} onChange={(e) => setPayer({ ...payer, documentNumber: e.target.value.replace(/\D/g, "") })} maxLength={documentLength} /></div></div>{error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"><p>{error}</p>{errorCode === "PIX_KEY_REQUIRED" && <p className="mt-2 text-xs text-muted-foreground">No Mercado Pago, acesse <strong>Área Pix → Suas chaves</strong>, cadastre uma chave para esta conta e depois clique novamente em Gerar Pix.</p>}</div>}<p className="flex items-start gap-2 text-xs text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />O e-mail da conta é usado automaticamente. Pagamento processado pelo Mercado Pago.</p></div>}

          {step === "pix" && pix && <div className="text-center"><div className="mx-auto w-fit rounded-2xl border bg-white p-3 shadow-sm"><img src={`data:image/png;base64,${pix.qrCodeBase64}`} alt="QR Code Pix" className="size-52" /></div><p className="mt-4 text-2xl font-bold">{currency.format(pix.amount)}</p><p className="text-sm text-muted-foreground">{pix.credits.toLocaleString("pt-BR")} créditos</p><Button type="button" variant="outline" className="mt-4 w-full" onClick={async () => { await navigator.clipboard.writeText(pix.qrCode); setCopied(true); }}>{copied ? <Check className="size-4" /> : <Clipboard className="size-4" />}{copied ? "Código copiado" : "Copiar Pix Copia e Cola"}</Button><div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin text-primary" />Aguardando confirmação do pagamento</div></div>}

          {step === "done" && <div className="flex flex-col items-center py-5 text-center"><span className="grid size-14 place-items-center rounded-full bg-primary text-primary-foreground"><CheckCircle2 className="size-7" /></span><p className="mt-4 text-lg font-semibold">Recarga concluída</p><p className="mt-1 text-sm text-muted-foreground">Seu novo saldo é de {balance.toLocaleString("pt-BR")} créditos.</p></div>}
        </div>

        <DialogFooter className="border-t border-border px-5 py-4 sm:px-6">{step === "amount" && <Button className="w-full sm:w-auto" disabled={chosenCredits < 1} onClick={() => setStep("payer")}>Continuar • {currency.format(chosenPrice)}</Button>}{step === "payer" && <div className="flex w-full gap-2 sm:justify-end"><Button variant="outline" onClick={() => setStep("amount")}>Voltar</Button><Button disabled={!payerValid || loading} onClick={createPix}>{loading && <Loader2 className="size-4 animate-spin" />}Gerar Pix</Button></div>}{step === "done" && <Button className="w-full sm:w-auto" onClick={() => setOpen(false)}>Concluir</Button>}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
