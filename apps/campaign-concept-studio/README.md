# Campaign Concept Studio

A full-stack campaign workbench for marketing teams. Enter a short brief, audience, product details, tone, and channels; the app returns a campaign platform, three copy routes, a launch checklist, visual prompts, and generated campaign references.

## Architecture

- **Browser:** React + Vite UI only. It collects the brief and calls `POST /api/generate`.
- **Server:** `server/campaign.ts` owns all OpenAI calls. `OPENAI_API_KEY` is read only on the server.
- **Local development:** `server.ts` provides the API on port 8787; Vite proxies `/api` to it.
- **Vercel:** `api/generate.ts` is the serverless entry point. Set the Vercel project Root Directory to `apps/campaign-concept-studio`.

This client/server boundary is intentional: no OpenAI SDK or secret is imported into the browser bundle.

## OpenAI flow

1. The server calls `client.responses.create()` with `gpt-5.6-luna` and Structured Outputs (`text.format.type = json_schema`) to produce the campaign plan.
2. The returned `imagePrompts` are passed back through the Responses API with the `image_generation` tool.
3. The server returns the structured plan plus generated PNG data URLs to the browser.

The model selection follows the current OpenAI model guidance: GPT-5.6 Luna is the cost-sensitive member of the GPT-5.6 family, and the Responses API is the recommended surface for tool-calling workflows. GPT-5.6 Luna supports image generation through the Responses API image-generation tool.

## Install and run

Requirements: Node.js 22+ and npm.

```bash
cd apps/campaign-concept-studio
cp .env.example .env
# Put the API key in .env; never commit it.
npm install
npm run dev
```

Open the Vite URL shown by the dev server (normally `http://localhost:4173`).

## Environment

Required:

- `OPENAI_API_KEY` — server-side OpenAI project API key.

Optional tuning:

- `OPENAI_TEXT_MODEL` — defaults to `gpt-5.6-luna`.
- `OPENAI_IMAGE_MODEL` — defaults to `gpt-5.6-luna` for the Responses image-generation tool.
- `PORT` — local API port, defaults to `8787`.

Never put `OPENAI_API_KEY` in `VITE_*` variables, client code, HTML, or committed files.

## Deployment

### Vercel

Create a Vercel project from this repository and set **Root Directory** to `apps/campaign-concept-studio`. The project can use the standard Vite build (`npm run build`, output `dist`). Add `OPENAI_API_KEY` as a server-side Environment Variable for the required environments. The `/api/generate` function is automatically deployed from `api/generate.ts`.

### Other Node hosts

Build the frontend with `npm run build`, then adapt the static-file serving around `server.ts` or place the built `dist` directory behind your existing Node/Express server.

## Validation plan

- **Static:** `npm run typecheck` catches TypeScript and client/server boundary mistakes.
- **Build:** `npm run build` verifies the production browser bundle.
- **Contract:** `npm test` validates required campaign fields and input limits without making an API call.
- **Smoke:** with a real key, submit a small brief and verify a structured concept, exactly three variants, a launch checklist, three prompts, and at least one generated image.
- **Failure:** remove `OPENAI_API_KEY` and verify the UI shows a recoverable error rather than exposing server details.

## Where to tune later

- **Text model:** `server/campaign.ts` → `OPENAI_TEXT_MODEL`.
- **Strategy prompt:** `server/campaign.ts` → `instructions`.
- **Structured output:** `server/campaign.ts` → `schema`.
- **Image model and settings:** `OPENAI_IMAGE_MODEL` plus the `image_generation` tool (`quality`, `size`, `background`).
- **Image count:** `imagePrompts.slice(0, 2)` controls how many images are generated; increase cautiously because generated images materially increase latency and cost.
- **Copy tone:** edit the strategy instructions and/or the `tone` input defaults in `src/App.tsx`.

## Notes

The UI intentionally handles empty, loading, and error states. Generated images are returned as data URLs for a simple stateless implementation; a production system with persistent campaign libraries should move images to object storage and persist campaign records separately.
