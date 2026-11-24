import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./core/logger";
import { prismaRaw } from "./core/prisma";

async function bootstrap() {
  const app = createApp();
  // Hosts (Render/Railway/Fly) inject the port to bind on via PORT.
  const port = Number(process.env.PORT) || env.API_PORT;
  const server = app.listen(port, () => {
    logger.info(`🚀 TechForge API listening on port ${port} (/api/v1)`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down`);
    server.close();
    await prismaRaw.$disconnect();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

bootstrap().catch((err) => {
  logger.error({ err }, "Failed to start API");
  process.exit(1);
});
