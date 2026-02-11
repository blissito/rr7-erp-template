import { createRequestHandler } from "@react-router/deno";
// @ts-ignore - build output will be generated
import * as build from "./build/server/index.js";

const port = Number(Deno.env.get("PORT")) || 3000;

const handler = createRequestHandler(build, Deno.env.get("NODE_ENV"));

Deno.serve({
  port,
  onListen({ hostname, port }) {
    console.log(`🚀 Server running at http://${hostname}:${port}`);
  },
}, handler);
