import type { APIRoute } from "astro";

export const GET: APIRoute = () =>
  Response.json({ revision: process.env.WOW_SIGNAL_REVISION ?? "development" });
