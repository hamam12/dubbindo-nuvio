# Dubbindo Nuvio Addon

A Stremio-protocol-compatible HTTP addon intended for Nuvio or other compatible clients.

## Current status

**Deployment-ready scaffold, not a working content source.**

- Serves the manifest endpoint.
- Declares movie and series catalogs with optional search.
- Implements catalog, metadata, and stream handlers.
- Exposes a health-check endpoint for hosting.
- Returns empty results until an authorized Dubbindo API or source is documented and integrated.

This project does not guess private endpoints, extract protected media URLs, bypass logins, age gates, DRM or paywalls, or redistribute content without permission.

## Run locally

Requires Node.js 18 or newer.

    npm install
    npm start

Then check localhost port 10000 at /healthz and /manifest.json.

## Render deployment

The repository includes a root render.yaml blueprint. In Render:

1. Choose New +, then Blueprint.
2. Connect GitHub and select hamam12/dubbindo-nuvio.
3. Review the dubbindo-nuvio-addon web service and deploy.
4. Test /healthz and /manifest.json on the generated onrender.com URL.

The free Render service may spin down after inactivity, so its first request can be slow.

## Next integration step

Provide official Dubbindo developer/API documentation or an authorized feed/embed specification. Then implement actual catalog search, metadata mapping, and permitted stream/embed handling.
