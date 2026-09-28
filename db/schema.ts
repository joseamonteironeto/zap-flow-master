import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const groupConfigs = sqliteTable("group_configs", {
  jid: text("jid").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull().default("ignored"),
  category: text("category").notNull().default("geral"),
  destinationJid: text("destination_jid"),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
  updatedAt: text("updated_at").notNull(),
});

export const affiliateSettings = sqliteTable("affiliate_settings", {
  id: integer("id").primaryKey(),
  amazonTrackingId: text("amazon_tracking_id").notNull().default(""),
  mercadoLivreLabel: text("mercado_livre_label").notNull().default(""),
  redirectDomain: text("redirect_domain").notNull().default(""),
  amazonEnabled: integer("amazon_enabled", { mode: "boolean" }).notNull().default(true),
  mercadoLivreEnabled: integer("mercado_livre_enabled", { mode: "boolean" }).notNull().default(false),
  updatedAt: text("updated_at").notNull(),
});
