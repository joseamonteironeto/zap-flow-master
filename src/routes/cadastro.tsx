import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Criar conta | TudoZap" },
      {
        name: "description",
        content:
          "Crie sua conta TudoZap e comece a automatizar grupos, respostas e o CRM do seu WhatsApp.",
      },
      { property: "og:title", content: "Criar conta | TudoZap" },
      {
        property: "og:description",
        content:
          "Crie sua conta TudoZap e comece a automatizar grupos, respostas e o CRM do seu WhatsApp.",
      },
    ],
  }),
  component: SignupPage,
});

function strengthOf(pwd: string) {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
}

const LABELS = ["Muito fraca", "Fraca", "Razoável", "Forte", "Excelente"];

function SignupPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const score = useMemo(() => strengthOf(password), [password]);

  return (
    <AuthShell
      title="Crie sua conta TudoZap"
      subtitle="Configure sua operação em poucos minutos."
      footer={
        <>
          Já possui uma conta?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ to: "/app" });
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="nome">Nome</Label>
          <Input id="nome" required placeholder="Seu nome completo" className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" required placeholder="voce@empresa.com" className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone</Label>
          <Input id="telefone" type="tel" required placeholder="(11) 90000-0000" className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="senha">Senha</Label>
          <Input
            id="senha"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="h-11"
          />
          <div className="flex items-center gap-2">
            <div className="flex h-1.5 flex-1 gap-1">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "flex-1 rounded-full transition-colors",
                    i < score ? "bg-primary" : "bg-muted",
                  )}
                />
              ))}
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">{LABELS[score]}</span>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmar">Confirmar senha</Label>
          <Input id="confirmar" type="password" required placeholder="••••••••" className="h-11" />
        </div>
        <label className="flex items-start gap-2.5 text-sm text-muted-foreground">
          <Checkbox id="termos" required className="mt-0.5" />
          <span>
            Li e aceito os{" "}
            <a href="#" className="text-primary hover:underline">
              Termos de Uso
            </a>{" "}
            e{" "}
            <a href="#" className="text-primary hover:underline">
              Política de Privacidade
            </a>
            .
          </span>
        </label>
        <Button type="submit" size="lg" className="h-12 w-full text-base">
          Criar minha conta
        </Button>
      </form>
    </AuthShell>
  );
}
