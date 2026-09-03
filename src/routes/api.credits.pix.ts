import { createFileRoute } from "@tanstack/react-router";
import { roundedCreditPrice } from "@/lib/credits";
import { mercadoPagoRequest, type MercadoPagoPayment } from "@/lib/mercado-pago";

type PixRequest = {
  credits?: number;
  email?: string;
  fullName?: string;
  documentType?: "CPF" | "CNPJ";
  documentNumber?: string;
};

function fail(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export const Route = createFileRoute("/api/credits/pix")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as PixRequest;
          const credits = Number(body.credits);
          const email = body.email?.trim();
          const fullName = body.fullName?.trim();
          const documentType = body.documentType === "CNPJ" ? "CNPJ" : "CPF";
          const documentNumber = body.documentNumber?.replace(/\D/g, "");

          if (!Number.isInteger(credits) || credits < 1 || credits > 1_000_000) return fail("Quantidade de créditos inválida.");
          if (!email || !/^\S+@\S+\.\S+$/.test(email)) return fail("Informe um e-mail válido.");
          if (!fullName || fullName.length < 3) return fail("Informe o nome completo do pagador.");
          if (!documentNumber || (documentType === "CPF" ? documentNumber.length !== 11 : documentNumber.length !== 14)) return fail(`Informe um ${documentType} válido.`);

          const [firstName, ...lastNameParts] = fullName.split(/\s+/);
          const idempotencyKey = crypto.randomUUID();
          const externalReference = `tudozap-credits-${crypto.randomUUID()}`;
          const notificationUrl = process.env.MERCADO_PAGO_WEBHOOK_URL?.trim();
          const payment = await mercadoPagoRequest<MercadoPagoPayment>("/v1/payments", {
            method: "POST",
            headers: { "X-Idempotency-Key": idempotencyKey },
            body: JSON.stringify({
              transaction_amount: roundedCreditPrice(credits),
              description: `${credits.toLocaleString("pt-BR")} créditos TudoZap`,
              payment_method_id: "pix",
              external_reference: externalReference,
              metadata: { credits },
              ...(notificationUrl ? { notification_url: notificationUrl } : {}),
              payer: {
                email,
                first_name: firstName,
                last_name: lastNameParts.join(" ") || firstName,
                identification: { type: documentType, number: documentNumber },
              },
            }),
          });

          const transaction = payment.point_of_interaction?.transaction_data;
          if (!transaction?.qr_code || !transaction.qr_code_base64) throw new Error("O Mercado Pago não retornou o QR Code do Pix.");

          return Response.json({
            id: payment.id,
            status: payment.status,
            expiresAt: payment.date_of_expiration,
            qrCode: transaction.qr_code,
            qrCodeBase64: transaction.qr_code_base64,
            ticketUrl: transaction.ticket_url,
            credits,
            amount: roundedCreditPrice(credits),
          });
        } catch (error) {
          if (error instanceof Error && error.message === "MERCADO_PAGO_NOT_CONFIGURED") return fail("O Mercado Pago ainda aguarda as credenciais da aplicação.", 503);
          console.error("Falha ao criar Pix Mercado Pago", error);
          return fail(error instanceof Error ? error.message : "Não foi possível gerar o Pix.", 502);
        }
      },
    },
  },
});
