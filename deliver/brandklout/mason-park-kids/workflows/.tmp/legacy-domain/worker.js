// pediatricdentistkatytx.com (and www) -> masonparkpediatricdental.com, 301, path and query kept.
// The practice's old domain; the new one is canonical. Routes: pediatricdentistkatytx.com/*, www.pediatricdentistkatytx.com/*
const TARGET = 'https://masonparkpediatricdental.com';
export default {
  async fetch(request) {
    const url = new URL(request.url);
    return new Response(null, {
      status: 301,
      headers: { Location: TARGET + url.pathname + url.search, 'Cache-Control': 'public, max-age=3600' },
    });
  },
};
