import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import path from "path";
import { fileURLToPath } from "url";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import multer from "multer";
import fs from "fs";
import { appRouter } from "./routers.js";
import { db, insertMedia } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT ?? 3030);

app.use(compression());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// ── Upload dir ──────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use("/uploads", express.static(UPLOAD_DIR));

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ── Upload endpoint ─────────────────────────────────────────
app.post("/api/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  const url = `/uploads/${req.file.filename}`;
  const media = await insertMedia({
    filename: req.file.originalname,
    url,
    mimeType: req.file.mimetype,
    size: req.file.size,
    pageId: req.body.pageId ? Number(req.body.pageId) : undefined,
  });
  res.json(media);
});

// ── tRPC ────────────────────────────────────────────────────
app.use("/api/trpc", createExpressMiddleware({
  router: appRouter,
  createContext: ({ req }) => {
    const auth = req.headers.authorization ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : undefined;
    return { token };
  },
}));

// ── Google OAuth ─────────────────────────────────────────────
const ALLOWED_GOOGLE_EMAILS = [
  "mauromoncaoestudos@gmail.com",
  "mauromoncaoadv.escritorio@gmail.com",
];
const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID     ?? "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const JWT_SECRET_OAUTH     = process.env.JWT_SECRET            ?? "sp-secret-2026";

function getBaseUrl(req: express.Request): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `${req.protocol}://${req.get("host")}`;
}

// Rota 1: Iniciar fluxo Google OAuth
app.get("/api/auth/google", (req, res) => {
  if (!GOOGLE_CLIENT_ID) return res.redirect("/login?error=google_not_configured");
  const baseUrl     = getBaseUrl(req);
  const redirectUri = `${baseUrl}/api/auth/google/callback`;
  const scope       = encodeURIComponent("openid email profile");
  const googleUrl   =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${scope}` +
    `&prompt=select_account`;
  return res.redirect(googleUrl);
});

// Rota 2: Callback Google OAuth — retorna JWT via query param (localStorage)
app.get("/api/auth/google/callback", async (req, res) => {
  const { code, error } = req.query as { code?: string; error?: string };
  if (error || !code) return res.redirect("/login?error=google_denied");

  try {
    const baseUrl     = getBaseUrl(req);
    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    // Trocar code por token Google
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code, client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri, grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) return res.redirect("/login?error=google_token_failed");

    const tokens = await tokenRes.json() as { access_token?: string };

    // Buscar perfil Google
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!profileRes.ok) return res.redirect("/login?error=google_token_failed");

    const profile = await profileRes.json() as { email?: string; name?: string };
    const email   = profile.email?.toLowerCase().trim() ?? "";

    // Whitelist check
    if (!ALLOWED_GOOGLE_EMAILS.includes(email)) {
      console.warn(`[Google OAuth] Acesso negado: ${email}`);
      return res.redirect("/login?error=email_not_authorized");
    }

    // Buscar ou criar admin
    const { getAdminByEmail, createAdmin } = await import("./db.js");
    let user = await getAdminByEmail(email);
    if (!user) {
      const bcrypt = await import("bcryptjs");
      const hash = await bcrypt.default.hash(Math.random().toString(36) + Date.now(), 12);
      user = await createAdmin({
        email, name: profile.name ?? email.split("@")[0],
        passwordHash: hash, role: "admin", isActive: true,
      });
    }
    if (!user.isActive) return res.redirect("/login?error=account_inactive");

    // Gerar JWT e redirecionar com token na URL (localStorage pattern)
    const jwt = await import("jsonwebtoken");
    const token = jwt.default.sign({ id: user.id }, JWT_SECRET_OAUTH, { expiresIn: "7d" });

    const params = new URLSearchParams({
      gtoken: token,
      gid:    String(user.id),
      gname:  user.name ?? "",
      gemail: user.email,
    });
    return res.redirect(`/login?${params.toString()}`);

  } catch (err) {
    console.error("[Google OAuth] Erro:", err);
    return res.redirect("/login?error=google_internal_error");
  }
});

// ── SPA ─────────────────────────────────────────────────────
const DIST = path.join(__dirname, "..", "dist", "public");
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get("*", (_, res) => res.sendFile(path.join(DIST, "index.html")));
}

app.listen(PORT, "0.0.0.0", () => console.log(`✅ Soluções Admin rodando na porta ${PORT}`));
