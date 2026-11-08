# Dubbindo Nuvio

Community project for a Dubbindo integration with Nuvio and Stremio-compatible clients.

## Project status

**The addon server scaffold is ready to deploy, but it is not yet connected to Dubbindo's catalog or playback source.** It currently returns empty catalog, metadata, and stream results. Do not treat this as a working streaming addon yet.

## Project components

- `manifest.json` and `providers/dubbindo.js` — original Nuvio scraper-provider scaffold.
- `addon/` — Stremio-protocol-compatible HTTP addon server with movie/series catalog, metadata, and stream handlers.
- `render.yaml` — Render Blueprint configuration for the addon web service.

## Deploy the addon on Render

1. Open Render and choose **New + → Blueprint**.
2. Connect GitHub if prompted, then select `hamam12/dubbindo-nuvio`.
3. Render reads `render.yaml` and creates the `dubbindo-nuvio-addon` service.
4. Deploy using the Free plan.
5. Once deployed, verify the service's `/healthz` and `/manifest.json` endpoints.

The addon install URL will be:

`https://YOUR-SERVICE-NAME.onrender.com/manifest.json`

Replace the hostname with the actual URL Render assigns. Add that manifest URL in Nuvio if its addon installation flow supports Stremio-compatible manifests.

Free Render services can spin down after inactivity and may take longer to respond to the first request.

## Local development

See [addon/README.md](addon/README.md). Requires Node.js 18 or newer.

## Implementing the Dubbindo source

Before connecting catalog and playback, verify an official Dubbindo API, feed, or embed specification and permission to use it. This project will not guess private endpoints, bypass authentication, age gates, DRM, paywalls, or access controls, or redistribute streams without authorization.

## License

See [LICENSE.txt](LICENSE.txt).
