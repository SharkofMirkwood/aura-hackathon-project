// Modern Vercel serverless function
import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import { registerRoutes } from "server/routes";

// Create Express app
const app = express();

// Add middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register routes
(async () => {
  await registerRoutes(app);
})();

// Export the handler for Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Convert Vercel request/response to Express format
  const expressReq = req as any;
  const expressRes = res as any;

  // Handle the request with Express
  app(expressReq, expressRes);
}
