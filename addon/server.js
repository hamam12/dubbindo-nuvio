"use strict";

/**
 * Dubbindo Nuvio - Stremio-compatible addon server.
 * Scaffold only: connect a documented/authorized Dubbindo source before
 * returning catalog entries, metadata, or streams.
 */
const express = require("express");
const { addonBuilder, getRouter } = require("stremio-addon-sdk");

const manifest = {
  id: "community.dubbindo.nuvio",
  version: "0.1.0",
  name: "Dubbindo Nuvio",
  description: "Dubbindo catalog integration scaffold for Nuvio and compatible clients.",
  resources: ["catalog", "meta", "stream"],
  types: ["movie", "series"],
  catalogs: [
    { type: "movie", id: "dubbindo-movies", name: "Dubbindo Movies",
      extra: [{ name: "search", isRequired: false }] },
    { type: "series", id: "dubbindo-series", name: "Dubbindo Series",
      extra: [{ name: "search", isRequired: false }] }
  ],
  idPrefixes: ["tt"]
};

const builder = new addonBuilder(manifest);

// No upstream catalog API is assumed or invented.
builder.defineCatalogHandler(async ({ type, id, extra }) => {
  const valid =
    (type === "movie" && id === "dubbindo-movies") ||
    (type === "series" && id === "dubbindo-series");
  if (!valid) return { metas: [] };
  if (extra && extra.search) return { metas: [] };
  return { metas: [] };
});

// Placeholders until an authorized API/source is verified.
builder.defineMetaHandler(async () => ({ meta: null }));
builder.defineStreamHandler(async () => ({ streams: [] }));

const app = express();
app.disable("x-powered-by");
app.get("/healthz", (_req, res) => {
  res.status(200).json({
    ok: true,
    addon: manifest.id,
    version: manifest.version,
    status: "scaffold",
    catalogConnected: false,
    streamsConnected: false
  });
});
app.use(getRouter(builder.getInterface()));

const port = Number(process.env.PORT) || 10000;
app.listen(port, "0.0.0.0", () => {
  console.log("Dubbindo Nuvio addon listening on port " + port);
});
