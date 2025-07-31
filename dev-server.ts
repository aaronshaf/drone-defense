#!/usr/bin/env bun
import { watch } from "fs";
import { spawn } from "bun";

// Initial build
console.log("🔨 Building...");
const buildResult = await spawn(["bun", "build", "./src/main.ts", "--outdir", "./public", "--target", "browser"]).exited;
if (buildResult !== 0) {
  console.error("❌ Initial build failed");
  process.exit(1);
}

// Start server
const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    let path = url.pathname;

    // Serve index.html for root
    if (path === "/" || path === "/index.html") {
      return new Response(Bun.file("./public/index.html"));
    }

    // Serve files from public directory
    const filePath = `./public${path}`;
    const file = Bun.file(filePath);
    
    if (await file.exists()) {
      return new Response(file);
    }

    return new Response("Not found", { status: 404 });
  },
});

console.log(`\n🎮 Drone Defense is running at http://localhost:${server.port}\n`);

// Watch for changes and rebuild
const watcher = watch("./src", { recursive: true }, async (event, filename) => {
  if (filename?.endsWith(".ts")) {
    console.log(`📝 Changed: ${filename}`);
    console.log("🔨 Rebuilding...");
    const rebuildResult = await spawn(["bun", "build", "./src/main.ts", "--outdir", "./public", "--target", "browser"]).exited;
    if (rebuildResult === 0) {
      console.log("✅ Build complete!");
    } else {
      console.error("❌ Build failed");
    }
  }
});

// Handle exit
process.on("SIGINT", () => {
  console.log("\n👋 Shutting down...");
  watcher.close();
  server.stop();
  process.exit(0);
});