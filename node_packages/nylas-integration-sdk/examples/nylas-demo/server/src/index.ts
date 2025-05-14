// Load environment variables before any other imports
import dotenv from "dotenv";
dotenv.config();

import Koa from "koa";
import Router from "koa-router";
import cors from "@koa/cors";
import bodyParser from "koa-bodyparser";
import { nylasRoutes } from "./routes/nylas";
import {
  hasDatabaseSupport,
  initializeNylasSDK,
  shutdownNylasSDK,
} from "./shared/nylas-instance";

// Create Koa app
const app = new Koa();
const router = new Router();

// Initialize services when app starts
async function startServer() {
  try {
    // Initialize Nylas SDK
    console.log("🚀 Initializing Nylas services...");
    await initializeNylasSDK();
    console.log("✅ Nylas services initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize services:", error);
    console.log("⚠️ Server will continue with limited functionality");
  }

  // Configure middleware
  app.use(cors({
    origin: "*",
    credentials: true,
  }));

  app.use(bodyParser());

  // Include Nylas routes
  router.use("/api/nylas", nylasRoutes.routes(), nylasRoutes.allowedMethods());

  // Use router and handle errors
  app.use(router.routes());
  app.use(router.allowedMethods());

  // Global error handler
  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (err: any) {
      console.error("Server error:", err);
      ctx.status = err.status || 500;
      ctx.body = {
        error: err.message || "Internal Server Error",
      };
      ctx.app.emit("error", err, ctx);
    }
  });

  // Start server
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🌐 Server running on http://localhost:${PORT}`);

    // Check database connection and display warning if no database support
    if (!hasDatabaseSupport()) {
      console.log("\n");
      console.log(
        "🔴 ==================================================================== 🔴",
      );
      console.log(
        "🔴  WARNING: Running in memory-only mode without database persistence   🔴",
      );
      console.log(
        "🔴  Nylas data (events/calendars/creds) will not be synced to database  🔴",
      );
      console.log(
        "🔴  Set CONNECTION_STRING environment variable to enable persistence    🔴",
      );
      console.log(
        "🔴 ==================================================================== 🔴",
      );
      console.log("\n");
    } else {
      console.log("✅ Database persistence enabled - user data will be stored");
    }
  });
}

// Start the server
startServer();

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down server...");

  // Shutdown Nylas SDK
  try {
    await shutdownNylasSDK();
  } catch (error) {
    console.error("Error during shutdown:", error);
  }

  console.log("Server closed");
  process.exit(0);
});
