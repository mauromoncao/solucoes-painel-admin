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

// ── SPA ─────────────────────────────────────────────────────
const DIST = path.join(__dirname, "..", "dist", "public");
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get("*", (_, res) => res.sendFile(path.join(DIST, "index.html")));
}

app.listen(PORT, "0.0.0.0", () => console.log(`✅ Soluções Admin rodando na porta ${PORT}`));
