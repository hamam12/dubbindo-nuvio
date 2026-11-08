# Dubbindo Nuvio

Community integration for Dubbindo with Nuvio and Stremio-compatible clients.

## Current implementation

The addon reads Dubbindo's public RSS feeds and exposes separate catalogs:

- Terbaru Dubbindo
- Film Movie
- TV Series
- Anime Movie
- Anime Series

Movie feeds appear as movie entries. TV Series and Anime Series feeds are grouped into series entries using season/episode patterns in their titles. Each grouped series metadata object includes an episode list, and each episode opens its corresponding Dubbindo embed page.

Search filters the returned catalog names and descriptions. Feed responses are cached in memory for three minutes.

## Playback behavior

Playback opens Dubbindo's own embed page. The addon does **not** extract or proxy MP4/HLS media URLs. The website's age-confirmation prompt and any other site-side requirements remain in place.

## Deploy on Render

1. Open Render and choose **New + → Blueprint**.
2. Connect GitHub and select `hamam12/dubbindo-nuvio`.
3. Render reads `render.yaml` and creates the `dubbindo-nuvio-addon` service.
4. Deploy using the Free plan.
5. Verify `/healthz` and `/manifest.json` on the assigned Render URL.
6. Add `https://YOUR-SERVICE-NAME.onrender.com/manifest.json` in Nuvio if its addon installation flow supports Stremio-compatible manifests.

Free Render services can spin down after inactivity and may take longer to respond to the first request.

## Local development

Requires Node.js 18 or newer.

```bash
cd addon
npm install
npm start
```

## Known limitations

- The addon depends on the RSS feeds exposed by Dubbindo. Feed item limits determine how much of the catalog is available; this is not yet a crawl of every historical listing page.
- Series grouping is inferred from title patterns such as `S1 E4`, `S01E04`, and `Episode 4`. Titles without recognizable episode numbering may be grouped as a one-episode series.
- Episode grouping and playback have been implemented in the addon code but still need a live Render/Nuvio test.
- Playback is through Dubbindo's official embed page, not native in-app MP4/HLS playback.

## License

See [LICENSE.txt](LICENSE.txt).
