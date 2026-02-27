import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema.js";
import { eq, desc, like, and, count, ilike } from "drizzle-orm";

const client = postgres(process.env.DATABASE_URL ?? "postgresql://localhost/solucoes_admin", { max: 10 });
export const db = drizzle(client, { schema });

// ── Auth ─────────────────────────────────────────────────────
export const getAdminByEmail = async (email: string) => {
  const [u] = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.email, email));
  return u ?? null;
};
export const getAdminById = async (id: number) => {
  const [u] = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.id, id));
  return u ?? null;
};
export const createAdmin = async (data: schema.InsertAdmin) => {
  const [u] = await db.insert(schema.adminUsers).values(data).returning();
  return u;
};
export const countAdmins = async () => {
  const [r] = await db.select({ c: count() }).from(schema.adminUsers);
  return Number(r?.c ?? 0);
};
export const touchLogin = async (id: number) => {
  await db.update(schema.adminUsers).set({ lastSignedIn: new Date() }).where(eq(schema.adminUsers.id, id));
};

// ── Pages ────────────────────────────────────────────────────
export const getAllPages = async (filters?: { status?: string; search?: string; hasVideo?: boolean }) => {
  let query = db.select().from(schema.pages).orderBy(desc(schema.pages.updatedAt));
  return query;
};
export const getPageById = async (id: number) => {
  const [p] = await db.select().from(schema.pages).where(eq(schema.pages.id, id));
  return p ?? null;
};
export const getPageBySlug = async (slug: string) => {
  const [p] = await db.select().from(schema.pages).where(eq(schema.pages.slug, slug));
  return p ?? null;
};
export const upsertPage = async (data: schema.InsertPage) => {
  if (data.id) {
    const [u] = await db.update(schema.pages).set({ ...data, updatedAt: new Date() }).where(eq(schema.pages.id, data.id)).returning();
    return u;
  }
  const [c] = await db.insert(schema.pages).values(data).returning();
  return c;
};
export const deletePage = async (id: number) => {
  await db.delete(schema.pages).where(eq(schema.pages.id, id));
};
export const duplicatePage = async (id: number) => {
  const src = await getPageById(id);
  if (!src) throw new Error("Page not found");
  const { id: _id, createdAt: _c, updatedAt: _u, publishedAt: _p, ...rest } = src;
  const slug = `${src.slug}-copia-${Date.now()}`;
  const [copy] = await db.insert(schema.pages).values({ ...rest, slug, title: `${src.title} (cópia)`, status: "draft", publishedAt: null }).returning();
  return copy;
};

// ── Videos ───────────────────────────────────────────────────
export const getAllVideos = async () => db.select().from(schema.videos).orderBy(desc(schema.videos.createdAt));
export const getVideoById = async (id: number) => {
  const [v] = await db.select().from(schema.videos).where(eq(schema.videos.id, id));
  return v ?? null;
};
export const upsertVideo = async (data: schema.InsertVideo) => {
  if (data.id) {
    const [u] = await db.update(schema.videos).set({ ...data, updatedAt: new Date() }).where(eq(schema.videos.id, data.id)).returning();
    return u;
  }
  const [c] = await db.insert(schema.videos).values(data).returning();
  return c;
};
export const deleteVideo = async (id: number) => {
  await db.update(schema.pages).set({ videoId: null } as any).where(eq(schema.pages.videoId, id));
  await db.delete(schema.videos).where(eq(schema.videos.id, id));
};
export const linkVideoToPage = async (pageId: number, videoId: number | null) => {
  await db.update(schema.pages).set({ videoId, updatedAt: new Date() }).where(eq(schema.pages.id, pageId));
};

// ── CTAs ─────────────────────────────────────────────────────
export const getCtasByPage = async (pageId: number) =>
  db.select().from(schema.ctas).where(eq(schema.ctas.pageId, pageId)).orderBy(schema.ctas.position);
export const upsertCta = async (data: any) => {
  if (data.id) {
    const [u] = await db.update(schema.ctas).set(data).where(eq(schema.ctas.id, data.id)).returning();
    return u;
  }
  const [c] = await db.insert(schema.ctas).values(data).returning();
  return c;
};
export const deleteCta = async (id: number) => db.delete(schema.ctas).where(eq(schema.ctas.id, id));

// ── Media ────────────────────────────────────────────────────
export const getAllMedia = async () => db.select().from(schema.mediaFiles).orderBy(desc(schema.mediaFiles.createdAt));
export const insertMedia = async (data: any) => {
  const [m] = await db.insert(schema.mediaFiles).values(data).returning();
  return m;
};
export const deleteMedia = async (id: number) => db.delete(schema.mediaFiles).where(eq(schema.mediaFiles.id, id));

// ── Leads ────────────────────────────────────────────────────
export const getAllLeads = async () => db.select().from(schema.leads).orderBy(desc(schema.leads.createdAt));
export const updateLeadStatus = async (id: number, status: string) => {
  const [l] = await db.update(schema.leads).set({ status }).where(eq(schema.leads.id, id)).returning();
  return l;
};

// ── Settings ─────────────────────────────────────────────────
export const getSetting = async (key: string) => {
  const [s] = await db.select().from(schema.settings).where(eq(schema.settings.settingKey, key));
  return s?.settingValue ?? null;
};
export const upsertSetting = async (key: string, value: string) => {
  const existing = await getSetting(key);
  if (existing !== null) {
    await db.update(schema.settings).set({ settingValue: value, updatedAt: new Date() }).where(eq(schema.settings.settingKey, key));
  } else {
    await db.insert(schema.settings).values({ settingKey: key, settingValue: value });
  }
};
export const getAllSettings = async () => db.select().from(schema.settings);

// ── Dashboard ────────────────────────────────────────────────
export const getDashboardStats = async () => {
  const [total]     = await db.select({ c: count() }).from(schema.pages);
  const [published] = await db.select({ c: count() }).from(schema.pages).where(eq(schema.pages.status, "published"));
  const [draft]     = await db.select({ c: count() }).from(schema.pages).where(eq(schema.pages.status, "draft"));
  const [archived]  = await db.select({ c: count() }).from(schema.pages).where(eq(schema.pages.status, "archived"));
  const [videos]    = await db.select({ c: count() }).from(schema.videos);
  const [media]     = await db.select({ c: count() }).from(schema.mediaFiles);
  const [leads]     = await db.select({ c: count() }).from(schema.leads);
  const [newLeads]  = await db.select({ c: count() }).from(schema.leads).where(eq(schema.leads.status, "new"));
  return {
    totalPages:  Number(total?.c    ?? 0),
    published:   Number(published?.c ?? 0),
    draft:       Number(draft?.c    ?? 0),
    archived:    Number(archived?.c ?? 0),
    totalVideos: Number(videos?.c   ?? 0),
    totalMedia:  Number(media?.c    ?? 0),
    totalLeads:  Number(leads?.c    ?? 0),
    newLeads:    Number(newLeads?.c ?? 0),
  };
};
