// api/server.js — Vercel Serverless Function Entry Point
// This file handles all /api/* requests as a serverless function

import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import multer from "multer";
import { appRouter } from "../server/routers.js";
import { insertMedia } from "../server/db.js";
import path from "path";
import { fileURLToPath } from "url";
import { tmpdir } from "os";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(cors({
  origin: process.env.VERCEL_URL
    ? [`https://${process.env.VERCEL_URL}`, /\.vercel\.app$/, /\.mauromoncao\.adv\.br$/]
    : true,
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// Health check
app.get("/api/health", (_, res) => res.json({
  status: "ok",
  timestamp: new Date().toISOString(),
  env: process.env.NODE_ENV ?? "unknown"
}));

// Upload — uses /tmp in serverless environment
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? tmpdir();
const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

app.post("/api/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  // In serverless, files go to /tmp — read and convert to base64 or serve differently
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

// tRPC
app.use("/api/trpc", createExpressMiddleware({
  router: appRouter,
  createContext: ({ req }) => {
    const auth = req.headers.authorization ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : undefined;
    return { token };
  },
}));

export default app;
