import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";

export function createServer() {
  const app = express();

  
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

 
  app.all(/^\/api\/.*/, (_req, res) => {
    res.status(404).json({ error: "API endpoint not found" });
  });

  
  app.use((err, _req, res, _next) => {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  });

  return app;
}

