// Cloudflare Pages Function: Proxies backend API routes to HuggingFace Space
// This replaces Vercel's rewrites in vercel.json

const BACKEND_URL = 'https://backend-core-backend-core.hf.space';

// Routes that should be proxied to the backend
const PROXY_PATHS = ['/auth', '/watchlist', '/progress', '/settings', '/notifications', '/users', '/ai'];

function shouldProxy(pathname) {
  return PROXY_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
}

export async function onRequest(context) {
  const url = new URL(context.request.url);

  // Only proxy backend routes — let everything else pass through (static files, SPA)
  if (!shouldProxy(url.pathname)) {
    return context.next();
  }

  // Handle CORS preflight (OPTIONS)
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Build target URL
  const targetUrl = `${BACKEND_URL}${url.pathname}${url.search}`;

  // Clone headers, remove host
  const headers = new Headers(context.request.headers);
  headers.delete('host');
  headers.delete('cf-connecting-ip');  // Avoid HF proxy conflicts

  const init = {
    method: context.request.method,
    headers,
  };

  // Forward request body for non-GET/HEAD
  if (!['GET', 'HEAD'].includes(context.request.method)) {
    init.body = context.request.body;
  }

  try {
    const response = await fetch(targetUrl, init);

    // Add CORS headers to response
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.delete('set-cookie');  // Remove any HF cookies

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch {
    return new Response(JSON.stringify({ success: false, message: 'Backend unavailable' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
