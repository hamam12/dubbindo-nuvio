"use strict";

const express = require("express");
const { addonBuilder, getRouter } = require("stremio-addon-sdk");

const BASE = "https://www.dubbindo.site";
const FEEDS = [
  { id: "dubbindo-latest", name: "Terbaru Dubbindo", url: "/videos/latest/rss", type: "movie" },
  { id: "dubbindo-movies", name: "Film Movie", url: "/videos/category/1/rss", type: "movie" },
  { id: "dubbindo-tv", name: "TV Series (episode)", url: "/videos/category/3/rss", type: "movie" },
  { id: "dubbindo-anime-movies", name: "Anime Movie", url: "/videos/category/4/rss", type: "movie" },
  { id: "dubbindo-anime-series", name: "Anime Series (episode)", url: "/videos/category/5/rss", type: "movie" }
];

const manifest = {
  id: "community.dubbindo.nuvio",
  version: "0.3.0",
  name: "Dubbindo",
  description: "Katalog Dubbindo: film, serial TV, dan anime dubbing Indonesia.",
  resources: ["catalog", "meta", "stream"],
  types: ["movie"],
  catalogs: FEEDS.map(feed => ({
    type: feed.type, id: feed.id, name: feed.name,
    extra: [{ name: "search", isRequired: false }]
  })),
  idPrefixes: ["dubbindo:"]
};

const cache = new Map();
const CACHE_MS = 3 * 60 * 1000;

function decodeXml(value = "") {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

function cleanText(value = "") {
  return decodeXml(value.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

function tagValue(xml, tag) {
  const match = xml.match(new RegExp("<" + tag + "(?:\\s[^>]*)?>([\\s\\S]*?)</" + tag + ">", "i"));
  return match ? decodeXml(match[1].trim()) : "";
}

function imageFromItem(item) {
  const candidates = [
    item.match(/<media:thumbnail[^>]+url=["']([^"']+)/i),
    item.match(/<itunes:image[^>]+href=["']([^"']+)/i),
    item.match(/<enclosure[^>]+url=["']([^"']+)/i),
    item.match(/<img[^>]+src=["']([^"']+)/i)
  ];
  return candidates.find(Boolean)?.[1] || undefined;
}

function parseFeed(xml, type) {
  const items = xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];
  return items.map(item => {
    const link = tagValue(item, "link");
    const guid = tagValue(item, "guid");
    const url = /^https?:\/\//i.test(link) ? link : guid;
    if (!url || !url.includes("/watch/")) return null;
    const slug = url.split("/").pop().replace(/\.html(?:\?.*)?$/i, "");
    const token = slug.includes("_") ? slug.slice(slug.lastIndexOf("_") + 1) : "";
    if (!token) return null;
    const title = cleanText(tagValue(item, "title")) || slug;
    const description = cleanText(tagValue(item, "description"));
    const poster = imageFromItem(item);
    return {
      id: "dubbindo:" + slug, type, name: title,
      description: description || undefined, poster, background: poster,
      posterShape: "poster", _sourceUrl: url,
      _embedUrl: BASE + "/embed/" + encodeURIComponent(token)
    };
  }).filter(Boolean);
}

async function getFeed(feed) {
  const cached = cache.get(feed.url);
  if (cached && Date.now() - cached.time < CACHE_MS) return cached.items;
  const response = await fetch(BASE + feed.url, {
    headers: { "User-Agent": "Dubbindo-Nuvio-Addon/0.3.0", "Accept": "application/rss+xml, application/xml, text/xml" },
    signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) throw new Error("Dubbindo RSS returned HTTP " + response.status);
  const xml = await response.text();
  if (!/<(?:rss|feed)\b/i.test(xml)) throw new Error("Dubbindo did not return an RSS feed");
  const items = parseFeed(xml, feed.type);
  cache.set(feed.url, { time: Date.now(), items });
  return items;
}

function publicMeta(item) {
  const { _sourceUrl, _embedUrl, ...meta } = item;
  meta.links = [{ name: "Dubbindo", category: "website", url: _sourceUrl }];
  return meta;
}

const builder = new addonBuilder(manifest);
builder.defineCatalogHandler(async ({ type, id, extra }) => {
  const feed = FEEDS.find(entry => entry.id === id && entry.type === type);
  if (!feed) return { metas: [] };
  try {
    const query = String(extra?.search || "").trim().toLocaleLowerCase("id");
    const items = await getFeed(feed);
    const filtered = query ? items.filter(item =>
      (item.name + " " + (item.description || "")).toLocaleLowerCase("id").includes(query)
    ) : items;
    return { metas: filtered.slice(0, 100).map(publicMeta) };
  } catch (error) {
    console.error("[Dubbindo] Catalog error:", error.message);
    return { metas: [] };
  }
});

builder.defineMetaHandler(async ({ type, id }) => {
  if (type !== "movie") return { meta: null };
  try {
    const slug = String(id || "").replace(/^dubbindo:/, "");
    if (!slug || slug.includes("/") || slug.includes("..")) return { meta: null };
    for (const feed of FEEDS) {
      const found = (await getFeed(feed)).find(item => item.id === id);
      if (found) return { meta: publicMeta(found) };
    }
    const pageUrl = BASE + "/watch/" + encodeURIComponent(slug) + ".html";
    const response = await fetch(pageUrl, {
      headers: { "User-Agent": "Dubbindo-Nuvio-Addon/0.3.0" },
      signal: AbortSignal.timeout(12000)
    });
    if (!response.ok) return { meta: null };
    const html = await response.text();
    const title = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1];
    if (!title) return { meta: null };
    const description = (html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i) || [])[1];
    const poster = (html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)/i) || [])[1];
    return { meta: {
      id, type, name: cleanText(title),
      description: description ? cleanText(description) : undefined,
      poster, background: poster,
      links: [{ name: "Dubbindo", category: "website", url: pageUrl }]
    }};
  } catch (error) {
    console.error("[Dubbindo] Metadata error:", error.message);
    return { meta: null };
  }
});

builder.defineStreamHandler(async ({ type, id }) => {
  try {
    const slug = String(id || "").replace(/^dubbindo:/, "");
    if (type !== "movie" || !slug || slug.includes("/") || slug.includes("..")) return { streams: [] };
    for (const feed of FEEDS) {
      const found = (await getFeed(feed)).find(item => item.id === id);
      if (found && found._embedUrl) return { streams: [{
        name: "Dubbindo", title: "Buka pemutar resmi Dubbindo", externalUrl: found._embedUrl
      }]};
    }
    const token = slug.includes("_") ? slug.slice(slug.lastIndexOf("_") + 1) : "";
    return token ? { streams: [{
      name: "Dubbindo", title: "Buka pemutar resmi Dubbindo",
      externalUrl: BASE + "/embed/" + encodeURIComponent(token)
    }] } : { streams: [] };
  } catch (error) {
    console.error("[Dubbindo] Stream error:", error.message);
    return { streams: [] };
  }
});

const app = express();
app.disable("x-powered-by");
app.get("/healthz", (_req, res) => res.json({
  ok: true, addon: manifest.id, version: manifest.version,
  status: "rss-catalog-and-official-embed",
  catalogs: FEEDS.map(({ id, name, type }) => ({ id, name, type })),
  playbackMode: "official-embed", directStreamsConnected: false
}));
app.use(getRouter(builder.getInterface()));

const port = Number(process.env.PORT) || 10000;
app.listen(port, "0.0.0.0", () => console.log("Dubbindo Nuvio addon listening on port " + port));
