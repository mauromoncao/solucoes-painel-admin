// api/index.js — Vercel Serverless Function
// Wraps the entire Express + tRPC backend for serverless deployment

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { createExpressMiddleware } = require("@trpc/server/adapters/express");

// Dynamic imports for ESM modules
let appRouter;
let db;

async function getRouter() {
  if (!appRouter) {
    const routersModule = await import("../server/routers.js");
    appRouter = routersModule.appRouter;
  }
  return appRouter;
}

async function createApp() {
  const router = await getRouter();
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "10mb" }));
  app.use(cookieParser());

  // Health check
  app.get("/api/health", (_, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

  // tRPC
  app.use("/api/trpc", createExpressMiddleware({
    router,
    createContext: ({ req }) => {
      const auth = req.headers.authorization ?? "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7) : undefined;
      return { token };
    },
  }));

  return app;
}

let cachedApp;

module.exports = async (req, res) => {
  if (!cachedApp) {
    cachedApp = await createApp();
  }
  return cachedApp(req, res);
};
