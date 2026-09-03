import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  Clock3,
  Coins,
  Copy,
  MessageSquareText,
  Phone,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Card, PageHeader, Pill, StatCard } from "@/components/app/Ui";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ensureCleanPanelStorage } from "@/lib/panel-data";

export const Route = createFileRoute("/app/comprar-whatsapp")({
  head: () => ({
    meta: [
      { title: "Comprar WhatsApp | Painel TudoZap" },
      {
        name: "description",
        content: "Compre e acompanhe números brasileiros para ativação do WhatsApp.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BuyWhatsAppPage,
});

type PurchasedNumber = {
  id: number;
  number: string;
  status: "active" | "cancelled";
  smsStatus: "waiting" | "received" | "cancelled";
  smsCode?: string;
  country: "BR";
  points: number;
  createdAt: string;
};

const STORAGE_KEY = "tudozap-whatsapp-numbers";
const NUMBER_PRICE = 35;
function readNumbers(): PurchasedNumber[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function createBrazilianNumber() {
  const ddds = [11, 21, 31, 41, 51, 61, 71, 81, 85];
  const ddd = ddds[Math.floor(Math.random() * ddds.length)];
  const first = Math.floor(1000 + Math.random() * 9000);
  const last = Math.floor(1000 + Math.random() * 9000);
  return `+55 ${ddd} 9${first}-${last}`;
}

function BuyWhatsAppPage() {
  const [numbers, setNumbers] = useState<PurchasedNumber[]>([]);
  const [balance, setBalance] = useState(0);
  const [error, setError] = useState("");
  const [cancelTarget, setCancelTarget] = useState<PurchasedNumber | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    ensureCleanPanelStorage();
    const storedNumbers = readNumbers();
    setNumbers(storedNumbers);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storedNumbers));
    setBalance(Number(window.localStorage.getItem("tudozap-credits")) || 0);
  }, []);

  const persist = (next: PurchasedNumber[]) => {
    setNumbers(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };
  const activeCount = useMemo(
    () => numbers.filter((item) => item.status === "active").length,
    [numbers],
  );

  const buyNumber = () => {
    if (balance < NUMBER_PRICE) {
      setError(`Você precisa de ${NUMBER_PRICE} pontos. Recarregue seu saldo no topo do painel.`);
      return;
    }
    setError("");
    const id = Date.now();
    const purchased: PurchasedNumber = {
      id,
      number: createBrazilianNumber(),
      status: "active",
      smsStatus: "waiting",
      country: "BR",
      points: NUMBER_PRICE,
      createdAt: new Date().toISOString(),
    };
    const nextBalance = balance - NUMBER_PRICE;
    setBalance(nextBalance);
    window.localStorage.setItem("tudozap-credits", String(nextBalance));
    window.dispatchEvent(new Event("tudozap-credits-updated"));
    persist([purchased, ...numbers]);
    window.setTimeout(() => {
      setNumbers((current) => {
        const updated = current.map((item) =>
          item.id === id && item.status === "active"
            ? {
                ...item,
                smsStatus: "received" as const,
                smsCode: String(Math.floor(100000 + Math.random() * 900000)).replace(
                  /(\d{3})(\d{3})/,
                  "$1 $2",
                ),
              }
            : item,
        );
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    }, 4000);
  };

  const cancelNumber = () => {
    if (!cancelTarget) return;
    persist(
      numbers.map((item) =>
        item.id === cancelTarget.id
          ? { ...item, status: "cancelled", smsStatus: "cancelled", smsCode: undefined }
          : item,
      ),
    );
    setCancelTarget(null);
  };

  const copySms = async (item: PurchasedNumber) => {
    if (!item.smsCode) return;
    await navigator.clipboard.writeText(item.smsCode.replace(/\s/g, ""));
    setCopiedId(item.id);
    window.setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <>
      <PageHeader
        title="Comprar WhatsApp"
        subtitle="Adquira números brasileiros e acompanhe o recebimento do SMS"
        actions={
          <Button onClick={buyNumber}>
            <ShoppingCart className="size-4" />
            Comprar (Brasil) · {NUMBER_PRICE} pontos
          </Button>
        }
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Saldo disponível"
          value={`${balance.toLocaleString("pt-BR")} pts`}
          delta="saldo atual"
        />
        <StatCard label="Valor por número" value={`${NUMBER_PRICE} pts`} delta="Brasil" />
        <StatCard
          label="Números comprados"
          value={String(numbers.length)}
          delta="histórico completo"
        />
        <StatCard
          label="Números ativos"
          value={String(activeCount)}
          delta="aguardando ou com SMS"
        />
      </section>

      {error ? (
        <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          {error}
        </div>
      ) : null}

      <Card
        title="Seus números"
        description="Compras, situação da ativação e códigos recebidos"
        actions={<Pill>{numbers.length} números</Pill>}
      >
        {numbers.length ? (
          <div className="-mx-4 overflow-x-auto sm:-mx-5">
            <table className="w-full min-w-[850px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 pb-3 font-medium sm:px-5">Número</th>
                  <th className="px-4 pb-3 font-medium">Status</th>
                  <th className="px-4 pb-3 font-medium">SMS</th>
                  <th className="px-4 pb-3 font-medium">País</th>
                  <th className="px-4 pb-3 font-medium">Valor</th>
                  <th className="px-4 pb-3 font-medium">Data</th>
                  <th className="px-4 pb-3 text-right font-medium sm:px-5">Ações</th>
                </tr>
              </thead>
              <tbody>
                {numbers.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border/60 last:border-0 hover:bg-muted/20"
                  >
                    <td className="px-4 py-4 font-semibold tabular-nums sm:px-5">
                      <span className="flex items-center gap-2">
                        <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                          <Phone className="size-4" />
                        </span>
                        {item.number}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <Pill tone={item.status === "active" ? "success" : "danger"}>
                        {item.status === "active" ? "Ativo" : "Cancelado"}
                      </Pill>
                    </td>
                    <td className="px-4 py-4">
                      {item.smsStatus === "received" ? (
                        <button
                          type="button"
                          onClick={() => copySms(item)}
                          className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-2.5 py-1.5 font-mono text-xs font-semibold text-primary"
                          title="Copiar SMS"
                        >
                          <CheckCircle2 className="size-3.5" />
                          {item.smsCode}
                          <Copy className="size-3" />
                        </button>
                      ) : item.smsStatus === "waiting" ? (
                        <Pill tone="warning">
                          <Clock3 className="size-3" />
                          Aguardando SMS
                        </Pill>
                      ) : (
                        <Pill tone="danger">SMS cancelado</Pill>
                      )}
                      {copiedId === item.id ? (
                        <span className="ml-2 text-[11px] text-primary">Copiado</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-2">
                        <span className="text-xl" role="img" aria-label="Brasil">
                          🇧🇷
                        </span>
                        Brasil
                      </span>
                    </td>
                    <td className="px-4 py-4 font-semibold tabular-nums">
                      <span className="inline-flex items-center gap-1">
                        <Coins className="size-3.5 text-primary" />
                        {item.points} pontos
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-4 text-right sm:px-5">
                      {item.status === "active" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setCancelTarget(item)}
                        >
                          <Trash2 className="size-4" />
                          Cancelar número
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sem ações</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center py-12 text-center">
            <MessageSquareText className="size-8 text-primary" />
            <h2 className="mt-3 font-semibold">Nenhum número comprado</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Clique em Comprar (Brasil) para adicionar o primeiro.
            </p>
          </div>
        )}
      </Card>

      <AlertDialog
        open={Boolean(cancelTarget)}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar este número?</AlertDialogTitle>
            <AlertDialogDescription>
              O número <strong className="text-foreground">{cancelTarget?.number}</strong> será
              cancelado e não poderá mais receber o SMS desta ativação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter número</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={cancelNumber}
            >
              <Trash2 className="size-4" />
              Cancelar número
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
