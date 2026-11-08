# Dubbindo Nuvio

Community scaffold for integrating Dubbindo Indonesia as a Nuvio scraper provider.

> **Status: not ready for playback.** This repository currently contains provider metadata and a safe placeholder implementation. It does not yet resolve playable streams.

## Repository layout

- `manifest.json` — repository and scraper metadata.
- `providers/dubbindo.js` — provider entry point.

## Current behavior

The provider exports:

```js
getStreams(tmdbId, mediaType, season, episode)
```

At present, this function intentionally returns an empty array. Dubbindo's public page structure and authorized direct media URLs have not been verified, so the implementation does not guess endpoints or attempt to bypass access controls.

## Integration notes

A Nuvio scraper provider resolves streams for a title or episode already selected in Nuvio. It does not automatically provide a movie/series catalog, trending list, search, or latest releases. Those features require a separate catalog integration.

The manifest's scraper is disabled by default until a working implementation is tested.

## Development checklist

1. Verify the source site's public page structure and terms.
2. Confirm that any media URLs used are publicly accessible and authorized for this integration.
3. Implement extraction for movies and episodic content using Nuvio's current provider contract.
4. Test valid, unavailable, and malformed titles; avoid returning unverified URLs.
5. Enable the scraper only after successful playback tests.

## Safety

Do not use this project to bypass DRM, paywalls, login requirements, geographic restrictions, or other access controls. Respect copyright and the source site's terms.

## License

See [LICENSE.txt](LICENSE.txt).
