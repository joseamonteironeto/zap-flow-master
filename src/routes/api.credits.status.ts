import { createFileRoute } from "@tanstack/react-router";
import { mercadoPagoRequest, type MercadoPagoPayment, validatedCreditsFromPayment } from "@/lib/mercado-pago";

export const Route = createFileRoute("/api/credits/status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const paymentId = new URL(request.url).searchParams.get("id") || "";
          if (!/^\d+$/.test(paymentId)) return Response.json({ error: "Pagamento inválido." }, { status: 400 });
          const payment = await mercadoPagoRequest<MercadoPagoPayment>(`/v1/payments/${paymentId}`);
          const credits = validatedCreditsFromPayment(payment);
          if (!credits) return Response.json({ error: "Pagamento não pertence a uma recarga TudoZap válida." }, { status: 422 });
          return Response.json({ id: payment.id, status: payment.status, approved: payment.status === "approved", credits });
        } catch (error) {
          console.error("Falha ao consultar Pix Mercado Pago", error);
          return Response.json({ error: "Não foi possível consultar o pagamento." }, { status: 502 });
        }
      },
    },
  },
});
