"use strict";

/**
 * Dubbindo Nuvio - Stremio-compatible addon server.
 *
 * The public Dubbindo page exposes an official embed page. Until a direct,
 * authorized MP4/HLS source is documented, this addon opens that embed page
 * instead of guessing or extracting a media URL.
 */
const express = require("express");
const { addonBuilder, getRouter } = require("stremio-addon-sdk");

const DUBBINDO_CARS_PAGE =
  "https://www.dubbindo.site/watch/cars-2006-dubbing-indonesia_MVRGx2VzbTZb2mm.html";
const DUBBINDO_CARS_EMBED =
  "https://www.dubbindo.site/embed/MVRGx2VzbTZb2mm";

const carsMeta = {
  id: "tt0317219",
  type: "movie",
  name: "Cars",
  releaseInfo: "2006",
  description:
    "Lightning McQueen tersesat di Radiator Springs dan menemukan arti persahabatan saat harus memperbaiki jalan kota tersebut.",
  runtime: "1h 56m",
  genres: ["Animation", "Adventure", "Comedy"],
  links: [
    { name: "Dubbindo", category: "website", url: DUBBINDO_CARS_PAGE }
  ]
};

const manifest = {
  id: "community.dubbindo.nuvio",
  version: "0.2.0",
  name: "Dubbindo Nuvio",
  description: "Katalog Dubbindo dengan tautan pemutar embed resmi.",
  resources: ["catalog", "meta", "stream"],
  types: ["movie"],
  catalogs: [
    {
      type: "movie",
      id: "dubbindo-movies",
      name: "Dubbindo Movies",
      extra: [{ name: "search", isRequired: false }]
    }
  ],
  idPrefixes: ["tt"]
};

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(async ({ type, id, extra }) => {
  if (type !== "movie" || id !== "dubbindo-movies") return { metas: [] };

  const query = String((extra && extra.search) || "").trim().toLowerCase();
  const matches = !query || "cars cars 2006".includes(query) ||
    query.includes("cars") || query.includes("2006");

  return { metas: matches ? [{ ...carsMeta }] : [] };
});

builder.defineMetaHandler(async ({ type, id }) => {
  if (type === "movie" && id === carsMeta.id) {
    return { meta: { ...carsMeta } };
  }
  return { meta: null };
});

builder.defineStreamHandler(async ({ type, id }) => {
  if (type !== "movie" || id !== carsMeta.id) return { streams: [] };

  return {
    streams: [
      {
        name: "Dubbindo • Official Embed",
        title: "Buka pemutar Dubbindo",
        externalUrl: DUBBINDO_CARS_EMBED
      }
    ]
  };
});

const app = express();
app.disable("x-powered-by");

app.get("/healthz", (_req, res) => {
  res.status(200).json({
    ok: true,
    addon: manifest.id,
    version: manifest.version,
    status: "embed-link",
    catalogConnected: true,
    directStreamsConnected: false,
    playbackMode: "official-embed"
  });
});

app.use(getRouter(builder.getInterface()));

const port = Number(process.env.PORT) || 10000;
app.listen(port, "0.0.0.0", () => {
  console.log("Dubbindo Nuvio addon listening on port " + port);
});
