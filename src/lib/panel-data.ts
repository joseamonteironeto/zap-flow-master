export const PANEL_USER = {
  fullName: "José Augusto Monteiro Neto",
  plan: "Plano inicial",
} as const;

const RESET_MARKER_KEY = "tudozap-data-version";
const RESET_VERSION = "clean-panel-2026-09-03";
const LEGACY_DATA_KEYS = [
  "tudozap-credits",
  "tudozap-processed-payments",
  "tudozap-instances",
  "tudozap-reaction-rules",
] as const;

/**
 * Executa uma única limpeza dos dados locais de demonstração já salvos no navegador.
 * Preferências visuais, credenciais de servidor e dados de outros sites não são tocados.
 */
export function ensureCleanPanelStorage() {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(RESET_MARKER_KEY) === RESET_VERSION) return;

  for (const key of LEGACY_DATA_KEYS) window.localStorage.removeItem(key);
  window.localStorage.setItem(RESET_MARKER_KEY, RESET_VERSION);
}
