/**
 * Dubbindo scraper provider for Nuvio.
 *
 * STATUS: scaffold only. No Dubbindo page patterns or authorized media
 * endpoints have been verified. Returning an empty array is intentional:
 * do not guess URLs or bypass DRM, paywalls, authentication, or access controls.
 *
 * Expected contract:
 *   getStreams(tmdbId, mediaType, season, episode) -> Promise<Array>
 *
 * Implement stream extraction only after verifying that the source is
 * publicly accessible and that use of the media URL is authorized.
 */
async function getStreams(tmdbId, mediaType, season, episode) {
  console.info("[Dubbindo] Provider scaffold called", {
    tmdbId,
    mediaType,
    season,
    episode
  });

  // TODO: Implement against verified, authorized Dubbindo endpoints.
  return [];
}

module.exports = { getStreams };
