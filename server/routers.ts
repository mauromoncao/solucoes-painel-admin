import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as db from "./db.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "sp-secret-2026";

export const t = initTRPC.context<{ token?: string }>().create();
const router = t.router;
const pub    = t.procedure;

const auth = t.middleware(async ({ ctx, next }) => {
  if (!ctx.token) throw new TRPCError({ code: "UNAUTHORIZED" });
  try {
    const payload = jwt.verify(ctx.token, JWT_SECRET) as { id: number };
    const user = await db.getAdminById(payload.id);
    if (!user || !user.isActive) throw new TRPCError({ code: "UNAUTHORIZED" });
    return next({ ctx: { ...ctx, user } });
  } catch {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
});
const priv = pub.use(auth);

// ── Page Schema ───────────────────────────────────────────────
const PageInput = z.object({
  id:              z.number().optional(),
  slug:            z.string().min(2),
  title:           z.string().min(2),
  subtitle:        z.string().optional(),
  description:     z.string().optional(),
  coverImage:      z.string().optional(),
  solutionKey:     z.string().optional(),
  status:          z.enum(["draft","published","archived"]).default("draft"),
  metaTitle:       z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords:    z.string().optional(),
  ogImage:         z.string().optional(),
  canonicalUrl:    z.string().optional(),
  videoId:         z.number().nullable().optional(),
  blocks:          z.array(z.any()).optional(),
});

// ── Video Schema ──────────────────────────────────────────────
const VideoInput = z.object({
  id:          z.number().optional(),
  title:       z.string().min(2),
  description: z.string().optional(),
  source:      z.enum(["youtube","vimeo","external","embed"]),
  url:         z.string().min(5),
  embedCode:   z.string().optional(),
  thumbnail:   z.string().optional(),
  duration:    z.string().optional(),
  position:    z.enum(["hero","after_hero","middle","before_cta","before_form","custom"]).default("after_hero"),
  ctaText:     z.string().optional(),
  ctaUrl:      z.string().optional(),
  supportText: z.string().optional(),
  isActive:    z.boolean().default(true),
});

export const appRouter = router({

  // ── Auth ─────────────────────────────────────────────────
  auth: router({
    setup: pub.input(z.object({ name: z.string(), email: z.string().email(), password: z.string().min(6) }))
      .mutation(async ({ input }) => {
        const total = await db.countAdmins();
        if (total > 0) throw new TRPCError({ code: "FORBIDDEN", message: "Setup já realizado" });
        const passwordHash = await bcrypt.hash(input.password, 12);
        const user = await db.createAdmin({ name: input.name, email: input.email, passwordHash, role: "admin", isActive: true });
        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });
        return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
      }),

    login: pub.input(z.object({ email: z.string().email(), password: z.string() }))
      .mutation(async ({ input }) => {
        const user = await db.getAdminByEmail(input.email);
        if (!user || !user.isActive) throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas" });
        const ok = await bcrypt.compare(input.password, user.passwordHash ?? "");
        if (!ok) throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas" });
        await db.touchLogin(user.id);
        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });
        return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
      }),

    me: priv.query(async ({ ctx }) => {
      const { passwordHash: _, ...u } = (ctx as any).user;
      return u;
    }),
    needsSetup: pub.query(async () => ({ needsSetup: (await db.countAdmins()) === 0 })),
  }),

  // ── Dashboard ────────────────────────────────────────────
  dashboard: router({
    stats: priv.query(async () => db.getDashboardStats()),
  }),

  // ── Pages ────────────────────────────────────────────────
  pages: router({
    list: priv.input(z.object({ status: z.string().optional(), search: z.string().optional(), hasVideo: z.boolean().optional() }).optional())
      .query(async ({ input }) => {
        const all = await db.getAllPages();
        let rows = await all;
        if (input?.status)   rows = rows.filter(p => p.status === input.status);
        if (input?.search)   rows = rows.filter(p => p.title.toLowerCase().includes(input.search!.toLowerCase()) || p.slug.includes(input.search!.toLowerCase()));
        if (input?.hasVideo !== undefined) rows = rows.filter(p => input.hasVideo ? p.videoId != null : p.videoId == null);
        return rows;
      }),
    byId:   priv.input(z.number()).query(async ({ input }) => db.getPageById(input)),
    bySlug: priv.input(z.string()).query(async ({ input }) => db.getPageBySlug(input)),
    save:   priv.input(PageInput).mutation(async ({ input }) => {
      const data: any = { ...input, updatedAt: new Date() };
      if (input.status === "published" && !input.id) data.publishedAt = new Date();
      return db.upsertPage(data);
    }),
    publish: priv.input(z.number()).mutation(async ({ input }) => {
      const page = await db.getPageById(input);
      if (!page) throw new TRPCError({ code: "NOT_FOUND" });
      return db.upsertPage({ ...page, status: "published", publishedAt: new Date() });
    }),
    unpublish: priv.input(z.number()).mutation(async ({ input }) => {
      const page = await db.getPageById(input);
      if (!page) throw new TRPCError({ code: "NOT_FOUND" });
      return db.upsertPage({ ...page, status: "draft" });
    }),
    archive: priv.input(z.number()).mutation(async ({ input }) => {
      const page = await db.getPageById(input);
      if (!page) throw new TRPCError({ code: "NOT_FOUND" });
      return db.upsertPage({ ...page, status: "archived" });
    }),
    duplicate: priv.input(z.number()).mutation(async ({ input }) => db.duplicatePage(input)),
    delete:    priv.input(z.number()).mutation(async ({ input }) => db.deletePage(input)),
    linkVideo: priv.input(z.object({ pageId: z.number(), videoId: z.number().nullable() }))
      .mutation(async ({ input }) => db.linkVideoToPage(input.pageId, input.videoId)),
  }),

  // ── Videos ───────────────────────────────────────────────
  videos: router({
    list:   priv.query(async () => db.getAllVideos()),
    byId:   priv.input(z.number()).query(async ({ input }) => db.getVideoById(input)),
    save:   priv.input(VideoInput).mutation(async ({ input }) => db.upsertVideo(input as any)),
    delete: priv.input(z.number()).mutation(async ({ input }) => db.deleteVideo(input)),
  }),

  // ── CTAs ─────────────────────────────────────────────────
  ctas: router({
    byPage:  priv.input(z.number()).query(async ({ input }) => db.getCtasByPage(input)),
    save:    priv.input(z.object({ id: z.number().optional(), pageId: z.number(), label: z.string(), url: z.string(), style: z.string().optional(), position: z.number().optional(), isActive: z.boolean().optional() }))
      .mutation(async ({ input }) => db.upsertCta(input)),
    delete:  priv.input(z.number()).mutation(async ({ input }) => db.deleteCta(input)),
  }),

  // ── Media ─────────────────────────────────────────────────
  media: router({
    list:   priv.query(async () => db.getAllMedia()),
    delete: priv.input(z.number()).mutation(async ({ input }) => db.deleteMedia(input)),
  }),

  // ── Leads ─────────────────────────────────────────────────
  leads: router({
    list:         priv.query(async () => db.getAllLeads()),
    updateStatus: priv.input(z.object({ id: z.number(), status: z.string() }))
      .mutation(async ({ input }) => db.updateLeadStatus(input.id, input.status)),
  }),

  // ── Settings ──────────────────────────────────────────────
  settings: router({
    all:    priv.query(async () => db.getAllSettings()),
    get:    priv.input(z.string()).query(async ({ input }) => db.getSetting(input)),
    set:    priv.input(z.object({ key: z.string(), value: z.string() })).mutation(async ({ input }) => db.upsertSetting(input.key, input.value)),
  }),
});

export type AppRouter = typeof appRouter;
