# Dubbindo Nuvio

Native Nuvio plugin for finding direct MP4/HLS sources exposed by Dubbindo's public watch pages.

## Install in Nuvio

1. Open **Nuvio → Settings → Plugins**.
2. Add this repository manifest URL:

   `https://raw.githubusercontent.com/hamam12/dubbindo-nuvio/main/manifest.json`

3. Refresh the plugin repository and enable **Dubbindo Indonesia**.

## Native provider status

- The native plugin lives at `providers/dubbindo.js`.
- It follows Nuvio's provider contract: `getStreams(tmdbId, mediaType, season, episode)`.
- Initial test mapping: **Cars (2006)**, TMDB movie ID `920`.
- It returns only direct HTML5 `.mp4` or `.m3u8` URLs found in the public watch page.
- It does not return an embed page as a playable stream, automate age confirmation, or bypass login, DRM, paywalls, or other access controls.
- If Dubbindo serves its age-confirmation screen instead of a public video source, the plugin intentionally returns an empty stream list.

## Current test limitation

The Cars watch page currently presents an 18+ age-confirmation prompt in the page response available to the provider. The native extractor therefore cannot yet confirm a direct media URL or playback in Nuvio. The provider code and manifest are committed, but successful native playback is **not yet verified**.

The first test should be run in Nuvio's Plugin Tester with movie TMDB ID `920`. A successful result must contain a direct MP4/HLS URL and play in Nuvio's native player.

## Repository contents

- `manifest.json` — Nuvio plugin registry.
- `providers/dubbindo.js` — native direct-stream provider.
- `addon/` — separate Stremio-compatible catalog addon; it is not required for the native plugin.
- `render.yaml` — deployment blueprint for the separate catalog addon.

## Development

The native provider uses the Nuvio JavaScript plugin runtime and the standard `fetch` API. The separate catalog addon can be run with Node.js 18+:

```bash
cd addon
npm install
npm start
```

## License

See [LICENSE.txt](LICENSE.txt).
