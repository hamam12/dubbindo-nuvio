# Dubbindo Nuvio

Community integration for public Dubbindo video listings with Nuvio and Stremio-compatible clients.

## Current implementation

The addon no longer uses a hard-coded Cars demo. It reads Dubbindo's linked RSS feeds and builds separate catalogs for:

- Latest videos
- Film Movie
- TV Series episodes
- Anime Movie
- Anime Series episodes

Each RSS entry is exposed as an independently playable video item. Search filters the titles and descriptions returned by each feed. Results are cached in memory for three minutes.

Playback opens the corresponding Dubbindo embed page. It does **not** extract or proxy MP4/HLS media URLs, and the site's age-confirmation flow remains intact.

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

## Limitations and next steps

- The addon reads the RSS feed items returned by Dubbindo; it does not guarantee that every historical page is included if the feed itself is paginated or limited.
- The TV and anime-series catalogs currently expose each uploaded episode as its own playable item, rather than grouping episodes into season-level series pages.
- Playback opens Dubbindo's own embed page. Native in-app playback needs a documented, authorized direct media integration.
- The website's age-confirmation prompt is not bypassed.

## License

See [LICENSE.txt](LICENSE.txt).
