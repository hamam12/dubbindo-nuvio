"use strict";

const express = require("express");
const { addonBuilder, getRouter } = require("stremio-addon-sdk");

const BASE = "https://www.dubbindo.site";
const FEEDS = [
  { id: "dubbindo-latest", name: "Terbaru Dubbindo", url: "/videos/latest/rss", type: "movie" },
  { id: "dubbindo-movies", name: "Film Movie", url: "/videos/category/1/rss", type: "movie" },
  { id: "dubbindo-other", name: "Other", url: "/videos/category/other/rss", type: "movie" },
  { id: "dubbindo-tv", name: "TV Series", url: "/videos/category/3/rss", type: "series" },
  { id: "dubbindo-anime-movies", name: "Anime Movie", url: "/videos/category/4/rss", type: "movie" },
  { id: "dubbindo-anime-series", name: "Anime Series", url: "/videos/category/5/rss", type: "series" }
];

const manifest = {
  id: "community.dubbindo.nuvio",
  version: "0.5.0",
  name: "Dubbindo",
  description: "Katalog Dubbindo: film, serial TV, dan anime dubbing Indonesia.",
  resources: ["catalog", "meta", "stream"],
  types: ["movie", "series"],
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
      id: "dubbindo:episode:" + slug, type, name: title,
      description: description || undefined, poster, background: poster,
      posterShape: "poster", _sourceUrl: url,
      _embedUrl: BASE + "/embed/" + encodeURIComponent(token),
      _slug: slug
    };
  }).filter(Boolean);
}

function parseEpisode(title) {
  const patterns = [
    { re: /\bS(?:eason)?\s*(\d{1,2})\s*[- ]*E(?:p(?:isode)?)?\s*(\d{1,3})\b/i, season: 1, episode: 2 },
    { re: /\bS(\d{1,2})E(\d{1,3})\b/i, season: 1, episode: 2 },
    { re: /\bSeason\s*(\d{1,2})\s*Episode\s*(\d{1,3})\b/i, season: 1, episode: 2 },
    { re: /\bEpisode\s*(\d{1,3})\b/i, season: 0, episode: 1 },
    { re: /\bEps?\s*(\d{1,3})\b/i, season: 0, episode: 1 }
  ];
  for (const pattern of patterns) {
    const match = title.match(pattern.re);
    if (!match) continue;
    const season = pattern.season === 0 ? 1 : Number(match[pattern.season]);
    const episode = Number(match[pattern.episode]);
    const name = cleanText(title.replace(pattern.re, " ")
      .replace(/\b[\[(]?(?:Bahasa Indonesia|Dubbing Indonesia|Dub Indo|Indo Dub|202\d|1080p|720p)[\])]?/ig, " ")
      .replace(/[\s\-–|:]+$/g, ""));
    return { seriesName: name || title, season, episode };
  }
  return { seriesName: title, season: 1, episode: 1 };
}

function slugify(value) {
  return value.toLowerCase().normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90) || "series";
}

function groupSeries(items) {
  const groups = new Map();
  for (const item of items) {
    const parsed = parseEpisode(item.name);
    const key = slugify(parsed.seriesName);
    if (!groups.has(key)) {
      groups.set(key, {
        id: "dubbindo:series:" + key,
        type: "series",
        name: parsed.seriesName,
        description: item.description,
        poster: item.poster,
        background: item.background,
        posterShape: "poster",
        links: [{ name: "Dubbindo", category: "website", url: item._sourceUrl }],
        videos: []
      });
    }
    const group = groups.get(key);
    const duplicate = group.videos.some(video => video.id === item.id);
    if (!duplicate) {
      group.videos.push({
        id: item.id,
        title: item.name,
        season: parsed.season,
        episode: parsed.episode,
        overview: item.description,
        thumbnail: item.poster
      });
    }
  }
  for (const group of groups.values()) {
    group.videos.sort((a, b) => a.season - b.season || a.episode - b.episode);
  }
  return [...groups.values()];
}

async function getFeed(feed) {
  const cached = cache.get(feed.url);
  if (cached && Date.now() - cached.time < CACHE_MS) return cached.items;
  const response = await fetch(BASE + feed.url, {
    headers: { "User-Agent": "Dubbindo-Nuvio-Addon/0.5.0", "Accept": "application/rss+xml, application/xml, text/xml" },
    signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) throw new Error("Dubbindo RSS returned HTTP " + response.status);
  const xml = await response.text();
  if (!/<(?:rss|feed)\b/i.test(xml)) throw new Error("Dubbindo did not return an RSS feed");
  const items = parseFeed(xml, feed.type);
  cache.set(feed.url, { time: Date.now(), items });
  return items;
}

async function allItemsForType(type) {
  const feeds = FEEDS.filter(feed => feed.type === type);
  const lists = await Promise.all(feeds.map(getFeed));
  const unique = new Map();
  for (const item of lists.flat()) unique.set(item.id, item);
  return [...unique.values()];
}

function publicMovie(item) {
  const { _sourceUrl, _embedUrl, _slug, ...meta } = item;
  meta.type = "movie";
  meta.links = [{ name: "Dubbindo", category: "website", url: _sourceUrl }];
  return meta;
}

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(async ({ type, id, extra }) => {
  const feed = FEEDS.find(entry => entry.id === id && entry.type === type);
  if (!feed) return { metas: [] };
  try {
    const query = String(extra?.search || "").trim().toLocaleLowerCase("id");
    let items = await getFeed(feed);
    let metas = type === "series" ? groupSeries(items) : items.map(publicMovie);
    if (query) metas = metas.filter(meta =>
      (meta.name + " " + (meta.description || "")).toLocaleLowerCase("id").includes(query)
    );
    const skip = Math.max(0, Number(extra?.skip) || 0);
    return { metas: metas.slice(skip, skip + 100) };
  } catch (error) {
    console.error("[Dubbindo] Catalog error:", error.message);
    return { metas: [] };
  }
});

builder.defineMetaHandler(async ({ type, id }) => {
  try {
    if (type === "series" && String(id).startsWith("dubbindo:series:")) {
      const key = String(id).slice("dubbindo:series:".length);
      const items = await allItemsForType("series");
      const group = groupSeries(items).find(meta => meta.id === id || slugify(meta.name) === key);
      return { meta: group || null };
    }

    if (type === "movie" && String(id).startsWith("dubbindo:episode:")) {
      const items = await allItemsForType("series");
      const found = items.find(item => item.id === id);
      return { meta: found ? publicMovie(found) : null };
    }

    if (type !== "movie") return { meta: null };
    const items = await allItemsForType("movie");
    const found = items.find(item => item.id === id);
    return { meta: found ? publicMovie(found) : null };
  } catch (error) {
    console.error("[Dubbindo] Metadata error:", error.message);
    return { meta: null };
  }
});

builder.defineStreamHandler(async ({ type, id }) => {
  try {
    const itemId = String(id || "");
    if (type !== "movie" && type !== "series") return { streams: [] };
    const items = await allItemsForType(type === "series" ? "series" : "movie");
    const found = items.find(item => item.id === itemId);
    if (!found || !found._embedUrl) return { streams: [] };
    return { streams: [{
      name: "Dubbindo",
      title: "Buka pemutar resmi Dubbindo",
      externalUrl: found._embedUrl
    }]};
  } catch (error) {
    console.error("[Dubbindo] Stream error:", error.message);
    return { streams: [] };
  }
});

const app = express();
app.disable("x-powered-by");
app.get("/healthz", (_req, res) => res.json({
  ok: true,
  addon: manifest.id,
  version: manifest.version,
  status: "rss-catalog-series-grouping-other-category-official-embed",
  catalogs: FEEDS.map(({ id, name, type }) => ({ id, name, type })),
  playbackMode: "official-embed",
  directStreamsConnected: false
}));
app.use(getRouter(builder.getInterface()));

const port = Number(process.env.PORT) || 10000;
app.listen(port, "0.0.0.0", () => console.log("Dubbindo Nuvio addon listening on port " + port));
