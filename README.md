# Social Media Content Analyzer 

**Author:** Anshika Sahu
**Roll Number:**2201641520031

---

## Overview

This is a **full-stack web application** built using **React, Vite, Tailwind CSS, and Express**.  
It provides both a frontend SPA and a backend API server for analyzing social media content.  

The project uses **SSR (Server-Side Rendering) configuration for backend** and serves the frontend SPA in production.  

---

## Features

- React frontend with SPA routing
- Express backend with API endpoints:
  - `/api/ping` – returns a ping message
  - `/api/demo` – example demo endpoint
- Health check endpoint `/health` for deployment services
- CORS support
- Tailwind CSS styling
- Compatible with Node.js v22+

---

## Project Structure

.
├── client/ # React frontend
├── server/ # Express backend
├── shared/ # Shared utilities/types
├── dist/ # Build output folder
│ ├── spa/ # Built frontend
│ └── server/ # Built backend
├── package.json
├── vite.config.ts # Vite frontend config
├── vite.config.server.ts # Vite server config
└── README.md

## Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd social

2. Install dependencies:

pnpm install
# or
npm install

Running Locally:

Development Mode (Frontend + Backend)
 pnpm dev
 # or
 npm run dev


Frontend: http://localhost:8080
Backend API: http://localhost:8080/api

Production Mode

1. Build the project:

 pnpm build
 # or
 npm run build

2. Start the server:

pnpm start
# or
npm run start


Frontend and backend will be served from the built dist folder.

API ENDPOINTS:

Ping: GET /api/ping
Returns { message: "ping" } (or value from .env PING_MESSAGE)

Demo: GET /api/demo
Returns { message: "Hello from Express server" }

Health Check: GET /health
Returns { status: "ok" }

Unknown API routes: Returns 404

DEPLOYMENT:

The project is ready for Render.com or any Node.js hosting platform.

Ensure the dist folder is included in deployment.

Set environment variables like PORT and PING_MESSAGE as required.