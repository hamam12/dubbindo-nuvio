# Dubbindo Nuvio

Community integration for Dubbindo with Nuvio and Stremio-compatible clients.

## Current status

The addon now exposes a **Cars (2006)** movie entry in the Dubbindo Movies catalog and returns Dubbindo's public embed page as an external playback link.

- Catalog: working for the initial Cars test entry.
- Metadata: working for the initial Cars test entry.
- Playback: opens Dubbindo's official embed page.
- Direct MP4/HLS stream extraction: not implemented; no verified authorized direct media URL is exposed by the public page inspection.

The public watch page includes an age-confirmation prompt. The addon does not attempt to bypass it. Playback therefore follows the same confirmation and player flow as the Dubbindo site.

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

## Next step: expand the catalog and playback

The initial entry is a working integration test, not a full-site catalog scraper. More catalog entries can be added from public listing pages. Native in-app playback requires a direct MP4/HLS URL or a documented player integration that is authorized for this use; the addon will not guess private endpoints or bypass DRM, authentication, age gates, paywalls, or access controls.

## License

See [LICENSE.txt](LICENSE.txt).
