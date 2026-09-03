import { roundedCreditPrice } from "@/lib/credits";

const API_URL = "https://api.mercadopago.com";

export type MercadoPagoPayment = {
  id: number;
  status: string;
  status_detail?: string;
  transaction_amount: number;
  external_reference?: string;
  metadata?: { credits?: number | string };
  date_of_expiration?: string;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    };
  };
};

export function getAccessToken() {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
  if (!token) throw new Error("MERCADO_PAGO_NOT_CONFIGURED");
  return token;
}

export async function mercadoPagoRequest<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${getAccessToken()}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const payload = (await response.json().catch(() => null)) as T | { message?: string } | null;
  if (!response.ok) {
    const message = payload && "message" in payload ? payload.message : undefined;
    throw new Error(message || `Mercado Pago respondeu com status ${response.status}`);
  }
  return payload as T;
}

export function validatedCreditsFromPayment(payment: MercadoPagoPayment) {
  const credits = Number(payment.metadata?.credits);
  if (!Number.isInteger(credits) || credits < 1 || credits > 1_000_000) return 0;
  const expected = roundedCreditPrice(credits);
  return Math.abs(Number(payment.transaction_amount) - expected) < 0.01 ? credits : 0;
}
