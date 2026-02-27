import pgTable from "drizzle-orm/pg-core";
import { serial, text, varchar, boolean, integer, timestamp, pgEnum, json } from "drizzle-orm/pg-core";

export const roleEnum    = pgEnum("sp_admin_role",   ["admin", "editor"]);
export const pageStatus  = pgEnum("sp_page_status",  ["draft", "published", "archived"]);
export const videoSource = pgEnum("sp_video_source", ["youtube", "vimeo", "external", "embed"]);
export const videoPos    = pgEnum("sp_video_pos",    ["hero", "after_hero", "middle", "before_cta", "before_form", "custom"]);
export const ctaStyle    = pgEnum("sp_cta_style",    ["primary", "secondary", "outline", "ghost"]);
export const blockType   = pgEnum("sp_block_type",   ["hero","video","text","benefits","faq","authority","form","cta","custom"]);

// ── Admin Users ──────────────────────────────────────────────
export const adminUsers = pgTable("sp_admin_users", {
  id:           serial("id").primaryKey(),
  email:        varchar("email",        { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  name:         varchar("name",         { length: 255 }).notNull(),
  role:         roleEnum("role").default("admin").notNull(),
  isActive:     boolean("isActive").default(true).notNull(),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn"),
});

// ── Páginas de Soluções ──────────────────────────────────────
export const pages = pgTable("sp_pages", {
  id:               serial("id").primaryKey(),
  slug:             varchar("slug",             { length: 255 }).notNull().unique(),
  title:            varchar("title",            { length: 255 }).notNull(),
  subtitle:         varchar("subtitle",         { length: 500 }),
  description:      text("description"),
  coverImage:       varchar("coverImage",       { length: 500 }),
  solutionKey:      varchar("solutionKey",      { length: 128 }), // ex: planejamento-tributario
  status:           pageStatus("status").default("draft").notNull(),
  // SEO
  metaTitle:        varchar("metaTitle",        { length: 255 }),
  metaDescription:  text("metaDescription"),
  metaKeywords:     varchar("metaKeywords",     { length: 500 }),
  ogImage:          varchar("ogImage",          { length: 500 }),
  canonicalUrl:     varchar("canonicalUrl",     { length: 500 }),
  // Video principal
  videoId:          integer("videoId"),
  // Blocos (JSON ordenado)
  blocks:           json("blocks").$type<PageBlock[]>().default([]),
  // Controle
  publishedAt:      timestamp("publishedAt"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().notNull(),
});

// ── Vídeos ───────────────────────────────────────────────────
export const videos = pgTable("sp_videos", {
  id:           serial("id").primaryKey(),
  title:        varchar("title",       { length: 255 }).notNull(),
  description:  text("description"),
  source:       videoSource("source").notNull(),
  url:          varchar("url",         { length: 1000 }).notNull(),
  embedCode:    text("embedCode"),
  thumbnail:    varchar("thumbnail",   { length: 500 }),
  duration:     varchar("duration",    { length: 20 }),
  // Configuração de exibição
  position:     videoPos("position").default("after_hero").notNull(),
  ctaText:      varchar("ctaText",     { length: 255 }),
  ctaUrl:       varchar("ctaUrl",      { length: 500 }),
  supportText:  text("supportText"),
  isActive:     boolean("isActive").default(true).notNull(),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().notNull(),
});

// ── CTAs ─────────────────────────────────────────────────────
export const ctas = pgTable("sp_ctas", {
  id:       serial("id").primaryKey(),
  pageId:   integer("pageId").notNull(),
  label:    varchar("label",   { length: 255 }).notNull(),
  url:      varchar("url",     { length: 500 }).notNull(),
  style:    ctaStyle("style").default("primary").notNull(),
  position: integer("position").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
});

// ── Mídia ────────────────────────────────────────────────────
export const mediaFiles = pgTable("sp_media", {
  id:        serial("id").primaryKey(),
  filename:  varchar("filename",  { length: 255 }).notNull(),
  url:       varchar("url",       { length: 500 }).notNull(),
  mimeType:  varchar("mimeType",  { length: 100 }),
  size:      integer("size"),
  alt:       varchar("alt",       { length: 255 }),
  pageId:    integer("pageId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ── Leads ────────────────────────────────────────────────────
export const leads = pgTable("sp_leads", {
  id:        serial("id").primaryKey(),
  pageId:    integer("pageId"),
  pageSlug:  varchar("pageSlug", { length: 255 }),
  name:      varchar("name",     { length: 255 }).notNull(),
  email:     varchar("email",    { length: 320 }),
  phone:     varchar("phone",    { length: 30 }),
  message:   text("message"),
  status:    varchar("status",   { length: 30 }).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ── Settings ─────────────────────────────────────────────────
export const settings = pgTable("sp_settings", {
  id:           serial("id").primaryKey(),
  settingKey:   varchar("settingKey",   { length: 128 }).notNull().unique(),
  settingValue: text("settingValue"),
  updatedAt:    timestamp("updatedAt").defaultNow().notNull(),
});

// ── Types ────────────────────────────────────────────────────
export type AdminUser    = typeof adminUsers.$inferSelect;
export type InsertAdmin  = typeof adminUsers.$inferInsert;
export type Page         = typeof pages.$inferSelect;
export type InsertPage   = typeof pages.$inferInsert;
export type Video        = typeof videos.$inferSelect;
export type InsertVideo  = typeof videos.$inferInsert;
export type Cta          = typeof ctas.$inferSelect;
export type MediaFile    = typeof mediaFiles.$inferSelect;
export type Lead         = typeof leads.$inferSelect;

export interface PageBlock {
  id:      string;
  type:    "hero"|"video"|"text"|"benefits"|"faq"|"authority"|"form"|"cta"|"custom";
  active:  boolean;
  order:   number;
  data:    Record<string, unknown>;
}
