/**
 * Dubbindo native Nuvio provider.
 *
 * Extracts only direct HTML5 MP4/HLS sources exposed in the public watch page.
 * It does not automate age confirmation or bypass login, DRM, paywalls, or
 * other access controls. If the site serves its age gate instead of a video
 * source, this provider intentionally returns no streams.
 *
 * Nuvio provider contract:
 *   getStreams(tmdbId, mediaType, season, episode) -> Promise<Array>
 */

var DUBBINDO = "https://www.dubbindo.site";
var MOVIE_MAP = {
  // Cars (2006), TMDB movie ID 920. Initial integration test case.
  "920": DUBBINDO + "/watch/cars-2006-dubbing-indonesia_MVRGx2VzbTZb2mm.html"
};

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/gi, "&")
    .replace(/&#x2F;/gi, "/")
    .replace(/&#47;/gi, "/")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

function absoluteUrl(value, pageUrl) {
  var raw = decodeHtml(value).trim().replace(/\\\//g, "/");
  if (!raw || raw.indexOf("javascript:") === 0 || raw.indexOf("data:") === 0) return "";
  try {
    return new URL(raw, pageUrl).toString();
  } catch (_) {
    if (/^https?:\/\//i.test(raw)) return raw;
    return "";
  }
}

function isDirectMedia(url) {
  return /\.(?:mp4|m3u8)(?:$|[?#])/i.test(url);
}

function extractMediaUrls(html, pageUrl) {
  var found = [];
  var patterns = [
    /<source\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi,
    /<video\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi
  ];

  patterns.forEach(function (pattern) {
    var match;
    while ((match = pattern.exec(html)) !== null) {
      var url = absoluteUrl(match[1], pageUrl);
      if (url && isDirectMedia(url) && found.indexOf(url) === -1) found.push(url);
    }
  });

  return found;
}

function getStreams(tmdbId, mediaType, season, episode) {
  if (mediaType !== "movie" || season != null || episode != null) {
    return Promise.resolve([]);
  }

  var pageUrl = MOVIE_MAP[String(tmdbId)];
  if (!pageUrl) {
    console.info("[Dubbindo] No verified title mapping for TMDB ID:", tmdbId);
    return Promise.resolve([]);
  }

  return fetch(pageUrl, {
    headers: {
      "Accept": "text/html,application/xhtml+xml",
      "User-Agent": "Mozilla/5.0 (compatible; Nuvio-Dubbindo/1.0)"
    }
  })
    .then(function (response) {
      if (!response || !response.ok) {
        throw new Error("Watch page HTTP " + (response ? response.status : "error"));
      }
      return response.text();
    })
    .then(function (html) {
      // Respect the site's age-confirmation gate; do not simulate consent.
      if (/are you 18 years old or above|age.?verification|confirm your age/i.test(html)) {
        console.info("[Dubbindo] Age confirmation is required; no stream extracted.");
        return [];
      }

      var urls = extractMediaUrls(html, pageUrl);
      return urls.map(function (url, index) {
        return {
          name: "Dubbindo",
          title: urls.length > 1 ? "Dubbindo source " + (index + 1) : "Dubbindo direct stream",
          url: url,
          quality: "Unknown",
          headers: { "Referer": pageUrl }
        };
      });
    })
    .catch(function (error) {
      console.error("[Dubbindo] Stream lookup failed:", error && error.message ? error.message : error);
      return [];
    });
}

module.exports = { getStreams };
