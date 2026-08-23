interface AssetFetcher {
  fetch(request: Request): Promise<Response>;
}

interface Env {
  ASSETS: AssetFetcher;
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return Response.json({
        status: 'ok',
        runtime: 'cloudflare-workers',
        timestamp: new Date().toISOString(),
      });
    }

    return env.ASSETS.fetch(request);
  },
};

export default worker;
