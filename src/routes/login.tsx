import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar | TudoZap" },
      {
        name: "description",
        content: "Acesse o painel TudoZap e gerencie grupos, automações e CRM do seu WhatsApp.",
      },
      { property: "og:title", content: "Entrar | TudoZap" },
      {
        property: "og:description",
        content: "Acesse o painel TudoZap e gerencie grupos, automações e CRM do seu WhatsApp.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  return (
    <AuthShell
      title="Bem-vindo de volta"
      subtitle="Entre para acompanhar sua operação em tempo real."
      footer={
        <>
          Ainda não possui uma conta?{" "}
          <Link to="/cadastro" className="font-medium text-primary hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          setLoading(true);
          setTimeout(() => navigate({ to: "/app" }), 500);
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" required placeholder="voce@empresa.com" className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="senha">Senha</Label>
          <Input id="senha" type="password" required placeholder="••••••••" className="h-11" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox id="lembrar" /> Lembrar de mim
          </label>
          <a href="#" className="text-sm text-primary hover:underline">
            Esqueci minha senha
          </a>
        </div>
        <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </AuthShell>
  );
}
