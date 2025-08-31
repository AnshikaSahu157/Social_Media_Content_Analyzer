import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "./index.js"; 
import express from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = createServer();
const port = process.env.PORT || 3000;


const distPath = path.join(__dirname, "../spa");


app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});


app.use(express.static(distPath));


app.use((req, res, next) => {
  if (req.path.startsWith("/api/") || req.path === "/health") return next();
  res.sendFile(path.join(distPath, "index.html"));
});


app.listen(port, () => {
  console.log(`🚀 Fusion Starter server running on port ${port}`);
  console.log(`📱 Frontend: http://localhost:${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
});


process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
