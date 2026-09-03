import { createFileRoute } from "@tanstack/react-router";
import { mercadoPagoRequest, type MercadoPagoPayment, validatedCreditsFromPayment } from "@/lib/mercado-pago";

function hex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function verifySignature(request: Request, dataId: string) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim();
  const signature = request.headers.get("x-signature") || "";
  const requestId = request.headers.get("x-request-id") || "";
  if (!secret || !signature || !requestId) return false;

  const parts = Object.fromEntries(signature.split(",").map((part) => part.trim().split("=", 2)));
  if (!parts.ts || !parts.v1) return false;
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${parts.ts};`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const expected = hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest)));
  if (expected.length !== parts.v1.length) return false;
  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) mismatch |= expected.charCodeAt(index) ^ parts.v1.charCodeAt(index);
  return mismatch === 0;
}

export const Route = createFileRoute("/api/mercadopago/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const body = (await request.clone().json().catch(() => ({}))) as { type?: string; data?: { id?: string | number } };
        const dataId = String(url.searchParams.get("data.id") || url.searchParams.get("data_id") || body.data?.id || "");
        if (!dataId || !(await verifySignature(request, dataId))) return new Response(null, { status: 401 });
        if (body.type === "payment" || !body.type) {
          try {
            const payment = await mercadoPagoRequest<MercadoPagoPayment>(`/v1/payments/${encodeURIComponent(dataId)}`);
            if (payment.status === "approved" && !validatedCreditsFromPayment(payment)) return new Response(null, { status: 422 });
          } catch (error) {
            console.error("Falha ao processar webhook Mercado Pago", error);
            return new Response(null, { status: 502 });
          }
        }
        return new Response(null, { status: 200 });
      },
    },
  },
});
